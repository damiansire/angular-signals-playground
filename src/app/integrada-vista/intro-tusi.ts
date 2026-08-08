import {
  bisectAngle,
  dotOffset,
  emergentCircleCenter,
  introNarration,
  lineAngle,
  lineFreq,
  phaseForLine,
} from './tusi-math';

/**
 * Intro "par de Tusi": la landing se CONSTRUYE sola. Arranca con una línea; cada 3 choques del punto
 * contra el extremo dispara la siguiente (propagación, como un signal actualizando a su dependiente),
 * hasta que el caos aparente se revela como un círculo. Suena en La menor (una nota por línea, timbre
 * sacado del video original). El usuario elige tema (Dark/Light) al entrar; ese click además desbloquea
 * el audio (política anti-autoplay del navegador). Imperativo como `molecule-engine`; devuelve su cleanup.
 */

interface Pal {
  dotA: string;
  dotB: string;
  line: string;
  revA: string;
  revB: string;
  flash: string;
}
const PALETTES: Record<'light' | 'dark', Pal> = {
  light: {
    dotA: '#eb9b3c',
    dotB: '#2f9e83',
    line: 'rgba(40,34,20,0.11)',
    revA: 'rgba(235,155,60,0.55)',
    revB: 'rgba(47,158,131,0.55)',
    flash: 'rgba(235,155,60,0.5)',
  },
  dark: {
    dotA: '#eb9b3c',
    dotB: '#62c4ad',
    line: 'rgba(233,227,211,0.11)',
    revA: 'rgba(235,155,60,0.6)',
    revB: 'rgba(98,196,173,0.6)',
    flash: 'rgba(255,220,160,0.6)',
  },
};

const MAX = 30;
const OMEGA = 2.513; // 5ta línea a los ~15 s
const HITS_PER_LINE = 3;
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];
const SPEED_START = 2; // índice de ×1
const REWARD_LINES = 8; // el contador de arriba se completa al llegar a 8 líneas
const REWARD_FULL_PHASE = phaseForLine(REWARD_LINES, HITS_PER_LINE);
// La frase musical cierra donde se completa el contador. Pasadas las 8 líneas los choques se agolpan
// (todas las líneas chocan al mismo ritmo, desfasadas) y el cúmulo suena raro por más que se baje el
// volumen: la construcción sigue creciendo en silencio.
const SOUND_LINES = REWARD_LINES;

interface Line {
  angle: number;
  phFloor?: number;
}

export interface IntroTusiOptions {
  /**
   * Si está, elegir el clima NO arranca la construcción: la deja lista y avisa, pasando el gatillo
   * para cuando corresponda. Es lo que deja meter el prólogo en el medio, porque si la construcción
   * corriera detrás durante esos minutos llegaría terminada y se comería su propio premio: el
   * círculo apareciendo. El overlay igual se cierra y el audio igual se desbloquea, que es lo único
   * que ese click tiene que hacer siempre.
   *
   * Recibe también si el sonido quedó activado. La preferencia se elige en ESTE overlay pero quien
   * suena a continuación es el prólogo: sin pasarla, alguien que silenciaba antes de entrar
   * igual escuchaba la cinemática entera, que es lo contrario de lo que acababa de pedir.
   */
  readonly onThemePicked?: (startBuild: () => void, conSonido: boolean) => void;
}

/** Lo que la landing le ofrece a quien la monta: cerrarla, y avisarle si está a la vista. */
export interface IntroTusiHandle {
  dispose: () => void;
  /** Lo llama el motor del recorrido, que es el único que sabe si la landing se está viendo. */
  setVisible: (visible: boolean) => void;
}

export function initIntroTusi(host: HTMLElement, options: IntroTusiOptions = {}): IntroTusiHandle {
  const q = <T extends HTMLElement>(sel: string): T => host.querySelector(sel) as T;
  const root = q<HTMLElement>('.tusi');
  const canvas = q<HTMLCanvasElement>('.tusi__canvas');
  // Falla ruidoso, igual que `initMolecule` con sus datos: devolver un no-op dejaba el overlay
  // puesto tapando el recorrido, sin sonido, sin construcción y sin una sola pista de por qué.
  // La landing quedaba trabada y el síntoma no apuntaba a ningún lado.
  if (!root) throw new Error('intro-tusi: falta .tusi en el host');
  if (!canvas) throw new Error('intro-tusi: falta .tusi__canvas en el host');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('intro-tusi: el canvas no dio contexto 2d');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pal = PALETTES.light;
  let speedIdx = SPEED_START;
  let paused = false;
  let soundOn = true;
  let started = false;
  /** El clima ya se eligió. Separado de `started` porque con prólogo hay un rato entre las dos. */
  let picked = false;
  let helpOn = false;
  // El motor fadea el `.intro` (opacity inline 1↔0) al scrollear; cuando no es visible cortamos el audio.
  const introEl = host.querySelector('.intro') as HTMLElement | null;
  let visible = true;

  // ── audio (timbre del video: fundamental + 2º armónico ~0.39 + 3º ~0.15, decay exp ~0.36 s) ──
  let actx: AudioContext | null = null;
  let master: GainNode | null = null;
  function initAudio(): void {
    if (actx) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    actx = new Ctor();
    master = actx.createGain();
    master.gain.value = 0.22;
    const comp = actx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(actx.destination);
  }
  function playNote(freq: number, vel: number): void {
    if (!actx || !master) return;
    const now = actx.currentTime;
    const g = actx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vel, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);
    g.connect(master);
    for (const [mul, amp] of [
      [1, 1.0],
      [2, 0.39],
      [3, 0.15],
    ]) {
      const o = actx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mul;
      const og = actx.createGain();
      og.gain.value = amp;
      o.connect(og);
      og.connect(g);
      o.start(now);
      o.stop(now + 0.42);
    }
  }

  // ── estado de la construcción ──
  let lines: Line[] = [];
  let phase: 'grow' | 'hold' = 'grow';
  let holdUntil = 0;
  let ph = reduce ? 0.6 : 0; // fase acumulada (ω·t integrado): cambiar velocidad no produce salto
  let phBase = 0; // fase al inicio del build actual (para la barra de recompensa)
  let prevExtreme = 0;
  let hits = 0;
  let flashes: { x: number; y: number; born: number }[] = [];
  let tPrev = 0;
  let rewardDone: boolean | null = null;

  let W = 0;
  let H = 0;
  let DPR = 1;
  function resize(): void {
    const r = canvas.getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const curR = (): number => 0.27 * Math.min(W, H);
  const curCenter = (): { x: number; y: number } => ({ x: W / 2, y: H * 0.34 });
  function reset(): void {
    if (reduce) {
      // Sin animación: figura estática ya formada (9 líneas → círculo), coherente con el copy de cierre.
      // Acá sí conviene equiespaciar (lineAngle): es una foto fija, no una construcción que deba quedar quieta.
      lines = Array.from({ length: 9 }, (_v, k) => ({ angle: lineAngle(k, 9) }));
      phase = 'hold';
      holdUntil = Infinity;
    } else {
      lines = [{ angle: bisectAngle(0) }];
      phase = 'grow';
    }
    prevExtreme = Math.floor(ph / Math.PI);
    hits = 0;
    flashes = [];
    phBase = ph;
    rewardDone = null;
  }

  function fade(rgba: string, m: number): string {
    return rgba.replace(/,\s*([\d.]+)\)$/, (_x, a) => ',' + (Number(a) * m).toFixed(3) + ')');
  }

  function step(t: number, dt: number): void {
    ph += dt * OMEGA * SPEEDS[speedIdx];

    // Cada choque (un punto llega al extremo de su línea) dispara la nota de esa línea + su octava grave.
    const sounding = Math.min(lines.length, SOUND_LINES);
    for (let k = 0; k < sounding; k++) {
      const L = lines[k];
      const f = Math.floor((ph - L.angle) / Math.PI);
      if (L.phFloor === undefined) L.phFloor = f;
      else if (f > L.phFloor) {
        L.phFloor = f;
        if (soundOn && visible) {
          const base = lineFreq(k);
          // hasta 7 líneas queda igual que antes; en la 8ª bajamos apenas el volumen por nota
          const soft = 0.4 + 0.6 * Math.min(1, 7 / sounding);
          playNote(base, 0.5 * soft);
          playNote(base / 2, 0.2 * soft);
        }
      }
    }

    if (phase === 'grow') {
      const ex = Math.floor(ph / Math.PI); // un choque de la línea 0 por cada extremo
      if (ex > prevExtreme) {
        const R = curR();
        const c = curCenter();
        const sgn = ex % 2 === 0 ? 1 : -1;
        flashes.push({ x: c.x + sgn * R, y: c.y, born: t });
        hits += ex - prevExtreme;
        prevExtreme = ex;
        if (hits >= HITS_PER_LINE) {
          hits -= HITS_PER_LINE;
          if (lines.length < MAX) {
            // Bisección: la nueva cae en la mitad de un hueco; las ya dibujadas no se mueven.
            lines.push({ angle: bisectAngle(lines.length) });
          } else {
            phase = 'hold';
            holdUntil = t + 4.5;
          }
        }
      }
    } else if (t >= holdUntil) {
      reset();
    }
  }

  function dot(x: number, y: number, col: string): void {
    ctx!.fillStyle = col;
    ctx!.shadowColor = col;
    ctx!.shadowBlur = 11;
    ctx!.beginPath();
    ctx!.arc(x, y, 4, 0, 7);
    ctx!.fill();
    ctx!.shadowBlur = 0;
  }

  function draw(t: number): void {
    ctx!.clearRect(0, 0, W, H);
    const R = curR();
    const c = curCenter();

    ctx!.lineWidth = 1;
    ctx!.strokeStyle = pal.line;
    for (const L of lines) {
      const dx = Math.cos(L.angle);
      const dy = Math.sin(L.angle);
      ctx!.beginPath();
      ctx!.moveTo(c.x - R * dx, c.y - R * dy);
      ctx!.lineTo(c.x + R * dx, c.y + R * dy);
      ctx!.stroke();
    }

    // Unión de los puntos del mismo color (círculo fino): SOLO cuando el usuario aprieta la ayuda.
    if (helpOn) {
      const a = emergentCircleCenter(R, ph, c.x, c.y, 1);
      const b = emergentCircleCenter(R, ph, c.x, c.y, -1);
      ctx!.lineWidth = 1.4;
      ctx!.strokeStyle = pal.revA;
      ctx!.beginPath();
      ctx!.arc(a.x, a.y, R / 2, 0, 7);
      ctx!.stroke();
      ctx!.strokeStyle = pal.revB;
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, R / 2, 0, 7);
      ctx!.stroke();
    }

    flashes = flashes.filter((f) => t - f.born < 0.6);
    for (const f of flashes) {
      const a = 1 - (t - f.born) / 0.6;
      ctx!.strokeStyle = fade(pal.flash, a);
      ctx!.lineWidth = 1.6;
      ctx!.beginPath();
      ctx!.arc(f.x, f.y, 6 + (1 - a) * 22, 0, 7);
      ctx!.stroke();
    }

    for (const L of lines) {
      const dx = Math.cos(L.angle);
      const dy = Math.sin(L.angle);
      const s = dotOffset(R, ph, L.angle);
      dot(c.x + s * dx, c.y + s * dy, pal.dotA);
      dot(c.x - s * dx, c.y - s * dy, pal.dotB);
    }
  }

  // ── UI: progreso, narración, ayuda, controles, overlay ──
  const narrateEl = q<HTMLElement>('.tusi__epigraph');
  const helpBtn = q<HTMLButtonElement>('.tusi__help');
  let lastNarration = '';

  const counterEl = q<HTMLElement>('.tusi__counter');
  const counterN = q<HTMLElement>('.tusi__counter-n');
  const pipEls = Array.from(host.querySelectorAll<HTMLElement>('.tusi__pip'));
  let lastShown = -1;
  let lastCounterOff: boolean | null = null;
  // El topbar del recorrido entra en la misma banda que el contador. Al primer gesto de scroll el
  // usuario ya se está yendo del intro: apagamos el contador antes de que los dos textos se pisen.
  let scrolled = false;

  helpBtn.addEventListener('click', () => {
    helpOn = !helpOn;
    helpBtn.textContent = helpOn ? 'Ocultar el círculo' : 'No la veo, ayudame';
  });

  const soundBtn = q<HTMLButtonElement>('.tusi__hud [data-role="sound"]');
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) {
      initAudio();
      if (actx?.state === 'suspended') void actx.resume();
    }
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', soundOn ? 'Silenciar' : 'Activar sonido');
  });

  q<HTMLButtonElement>('.tusi__hud [data-role="reset"]').addEventListener('click', reset);

  const pauseBtn = q<HTMLButtonElement>('.tusi__hud [data-role="pause"]');
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Reanudar animación' : 'Pausar animación');
  });

  const speedBtn = q<HTMLButtonElement>('[data-role="speed"]');
  const speedVal = q<HTMLElement>('.tusi__speed-val');
  const speedMenu = q<HTMLElement>('.tusi__menu');
  const openMenu = (): void => {
    speedMenu.classList.add('open');
    speedBtn.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = (): void => {
    speedMenu.classList.remove('open');
    speedBtn.setAttribute('aria-expanded', 'false');
  };
  function refreshSpeedMenu(): void {
    speedVal.textContent = '×' + SPEEDS[speedIdx];
    speedMenu.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((b) => {
      const on = Number(b.dataset['speed']) === SPEEDS[speedIdx];
      b.setAttribute('aria-checked', String(on));
      const ck = b.querySelector('.tusi__ck');
      if (ck) ck.textContent = on ? '✓' : '';
    });
  }
  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (speedMenu.classList.contains('open')) closeMenu();
    else openMenu();
  });
  speedMenu.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((b) => {
    b.addEventListener('click', () => {
      speedIdx = SPEEDS.indexOf(Number(b.dataset['speed']));
      refreshSpeedMenu();
      closeMenu();
    });
  });
  const onDocClick = (e: Event): void => {
    if (!speedMenu.contains(e.target as Node) && e.target !== speedBtn) closeMenu();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') closeMenu();
  };
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeyDown);

  // overlay "Primera luz": elegir tema arranca todo (y desbloquea el audio). El sonido es un
  // toggle amable que se pre-elige ANTES de entrar; `start` respeta esa preferencia.
  const overlay = q<HTMLElement>('.tusi__overlay');
  const ovSoundBtn = q<HTMLButtonElement>('[data-role="ov-sound"]');
  const ovSoundTxt = q<HTMLElement>('.tusi__ov-sound-txt');
  function refreshOvSound(): void {
    ovSoundBtn.setAttribute('aria-pressed', String(soundOn));
    ovSoundBtn.setAttribute(
      'aria-label',
      soundOn ? 'Silenciar el sonido de la intro' : 'Activar el sonido de la intro',
    );
    ovSoundTxt.textContent = soundOn
      ? 'Sonido activado · tocá para silenciar'
      : 'Sonido silenciado · tocá para activar';
  }
  ovSoundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    refreshOvSound();
  });
  function applyTheme(t: 'light' | 'dark'): void {
    pal = PALETTES[t];
    root.classList.toggle('dark', t === 'dark');
  }
  /** Empieza a construir. Separado de `start` porque el prólogo lo dispara más tarde. */
  function startBuild(): void {
    started = true;
  }
  function start(theme: 'light' | 'dark'): void {
    if (started || picked) return;
    picked = true;
    applyTheme(theme);
    if (options.onThemePicked) options.onThemePicked(startBuild, soundOn);
    else startBuild();
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', soundOn ? 'Silenciar' : 'Activar sonido');
    if (soundOn) {
      initAudio();
      if (actx?.state === 'suspended') void actx.resume();
    }
    reset();
    tapados().forEach((el) => (el.inert = false));
    overlay.classList.add('gone');
    // `.gone` sólo apaga opacidad y pointer-events: sin `inert` los botones del overlay siguen en el
    // orden de tabulación y en el árbol de a11y, invisibles pero alcanzables con Tab.
    overlay.inert = true;
  }
  /**
   * El overlay cubre el viewport, pero el chrome del recorrido que queda debajo sigue clickeable
   * (opacidad 0 y `pointer-events` activos). A 834 px de ancho el riel tapaba el centro del botón
   * para entrar y la app quedaba trabada acá, sin forma de arrancar.
   */
  const tapados = (): HTMLElement[] => {
    const intro = overlay.closest('.intro');
    return [...(intro?.parentElement?.children ?? [])].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== intro,
    );
  };
  tapados().forEach((el) => (el.inert = true));
  q<HTMLButtonElement>('[data-role="pick-dark"]').addEventListener('click', () => start('dark'));
  q<HTMLButtonElement>('[data-role="pick-light"]').addEventListener('click', () => start('light'));
  refreshOvSound();

  // ── loop ──
  let rafId = 0;
  // Latido lento de cuando el intro no se ve. La landing se cruza una vez y después queda
  // invisible detrás del recorrido, pero el rAF seguía dibujando el canvas a 60fps por el resto de
  // la sesión: trabajo de GPU y batería para algo que nadie mira. Fuera de vista no hay nada que
  // dibujar, solo hay que enterarse de cuándo vuelve, y para eso alcanza con mirar cada tanto.
  let idleId = 0;
  const REPOSO_MS = 200;

  /**
   * Lo llama el motor cuando la landing entra o sale de vista: es el único que lo sabe, porque lo
   * decide el scroll. Antes esto se averiguaba sondeando `introEl.style.opacity` cuadro a cuadro,
   * o sea leyendo el detalle de implementación del fade de otro módulo.
   */
  function aplicarVisibilidad(ahoraVisible: boolean): void {
    if (ahoraVisible === visible) return;
    visible = ahoraVisible;
    // El overlay cubre el viewport; si el intro no es la vista activa (scroll o deep-link directo al
    // recorrido SIN elegir tema), su subárbol interceptaría los clicks de los demos que quedaron
    // debajo (pointer-events se hereda, así que apagarlo en el overlay apaga todo el subárbol). Solo
    // mientras no se eligió tema: tras `start()`, `.gone` ya lo maneja y no hay que reactivarlo.
    // Va contra `picked` y no contra `started`: con prólogo en el medio hay minutos en los que el
    // clima ya se eligió y la construcción todavía no arrancó, y ahí el overlay volvería a tapar.
    if (!picked) {
      overlay.classList.toggle('gone', !visible);
      overlay.inert = !visible;
    }
    // El intro entero (controles de sonido/pausa/velocidad y el overlay) se desvanece con opacity,
    // que NO lo saca del tab-order ni del árbol de a11y. Con deep-link a un sub-nivel quedaban 7
    // controles invisibles pero tabulables, capaces de cambiar el tema sin que se vea nada.
    if (introEl) introEl.inert = !visible;
    if (actx) {
      if (visible && soundOn) void actx.resume();
      else if (!visible) void actx.suspend();
    }
    // Volver a la vista tiene que reanudar el dibujo aunque el latido lento esté esperando.
    if (visible && !rafId && !idleId) rafId = window.requestAnimationFrame(loop);
  }

  function loop(now: number): void {
    const t = now / 1000;
    const dt = Math.min(0.05, t - tPrev);
    tPrev = t;
    if (!visible) {
      // Nada que dibujar mientras no se ve. El latido lento existe igual para que volver a la vista
      // reanude solo aunque nadie avise: `aplicarVisibilidad` acorta la espera cuando sí avisan.
      rafId = 0;
      idleId = window.setTimeout(() => {
        idleId = 0;
        rafId = window.requestAnimationFrame(loop);
      }, REPOSO_MS);
      return;
    }

    if (!reduce && !paused && started) step(t, dt);
    draw(t);
    const prog = started ? (reduce ? 1 : Math.min(1, (ph - phBase) / REWARD_FULL_PHASE)) : 0;
    const narration = introNarration(prog, started);
    if (narration !== lastNarration) {
      narrateEl.textContent = narration;
      lastNarration = narration;
    }
    const shown = Math.min(lines.length, REWARD_LINES);
    if (shown !== lastShown) {
      lastShown = shown;
      counterN.textContent = String(shown);
      counterEl.setAttribute('aria-valuenow', String(shown));
      for (let k = 0; k < REWARD_LINES; k++) pipEls[k].classList.toggle('on', k < shown);
    }
    const done = prog >= 1;
    const counterOff = done || scrolled;
    if (counterOff !== lastCounterOff) {
      lastCounterOff = counterOff;
      counterEl.classList.toggle('done', counterOff);
    }
    if (done !== rewardDone) {
      rewardDone = done;
      helpBtn.classList.toggle('in', done);
      if (!done) {
        helpOn = false;
        helpBtn.textContent = 'No la veo, ayudame';
      }
    }
    rafId = window.requestAnimationFrame(loop);
  }

  const onResize = (): void => resize();
  const onUserScroll = (): void => {
    scrolled = true;
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('wheel', onUserScroll, { passive: true });
  window.addEventListener('touchmove', onUserScroll, { passive: true });
  resize();
  reset();
  refreshSpeedMenu();
  // sin animación no hay construcción que contar: el contador solo aportaría un parpadeo
  if (reduce) counterEl.hidden = true;
  rafId = window.requestAnimationFrame(loop);

  return {
    setVisible: aplicarVisibilidad,
    dispose: (): void => {
      window.cancelAnimationFrame(rafId);
      if (idleId) window.clearTimeout(idleId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
      void actx?.close();
    },
  };
}
