import { sonido } from '../libs/sonido';
import { bisectAngle } from './tusi-math';
import {
  GUION,
  PRESUPUESTO,
  anclajesDe,
  armarReloj,
  type Anclajes,
  type Hablante,
  type LineaEnReloj,
} from './prologo-guion';

/**
 * Prólogo de la intro: "la anomalía". Cuatro naves vuelven a casa, una anomalía se traga a tres, y
 * del otro lado lo que parecía caos resulta ser el par de Tusi visto de cerca. Termina con la
 * mascota ofreciéndose a enseñarles las reglas del lugar, que es el trato que la app le propone a
 * quien la abre: por eso el prólogo no es una escena previa sino el marco de todo el recorrido.
 *
 * Imperativo y en canvas, como `intro-tusi` y `molecule-engine`, y por el mismo motivo: son cientos
 * de partículas por cuadro y no hay estado de vista que valga la pena reflejar en signals. Devuelve
 * su cleanup.
 *
 * El reparto de responsabilidades importa: **el guion y el reloj viven en `prologo-guion.ts`** y se
 * testean como funciones puras; acá solo se dibuja. Todo momento de la animación cuelga de un
 * anclaje derivado del guion, así que alargar una frase mueve la escena con ella y nunca al revés.
 */

/** Una partícula del patrón, para que las naves puedan esquivar lo que tienen encima. */
interface Punto {
  x: number;
  y: number;
  r: number;
}

/** Cómo y dónde habla cada personaje. Que cada uno tenga su renglón fijo es lo que deja seguir la
 *  conversación sin poner nombres en pantalla. */
interface Estilo {
  y: number;
  x: number;
  tam: number;
  color: string;
  fuente: 'mono' | 'serif';
}

/** Estado de la nucleación en un cuadro: cuánto se juntaron las bolas y dónde están las dos nubes. */
interface Fusion {
  p: number;
  vivo: number;
  acerca: number;
  a: { x: number; y: number };
  b: { x: number; y: number };
}

/** Lo que el prólogo sintetiza por su cuenta, colgado de la salida común del director de sonido. */
interface RedDeAudio {
  readonly master: GainNode;
  readonly zumbido: OscillatorNode;
  readonly zumbidoGain: GainNode;
  readonly filtro: BiquadFilterNode;
}

/** Las teclas con las que el navegador (o el motor del recorrido) desplaza la página. */
/** Lo que tarda en apagarse el último pip del final antes de poder soltar la red de audio. */
const CIERRE_AUDIO_MS = 2500;

const TECLAS_DE_DESPLAZAMIENTO = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

export interface PrologoOpciones {
  /** Corre cuando el prólogo termina o se saltea: es el empalme con la intro que ya existe. */
  readonly alTerminar: () => void;
  /**
   * @deprecated Ya no se usa. El sonido es una preferencia global del director (`libs/sonido.ts`)
   * y el toggle del intro la cambia ahí mismo, así que llega resuelta. Queda para no romper a quien
   * todavía la pasa.
   */
  readonly conSonido?: boolean;
}

export function initPrologoAnomalia(host: HTMLElement, opts: PrologoOpciones): () => void {
  const contenedor = host.querySelector<HTMLElement>('.prologo');
  // El escenario es el que MIDE: la mascota se ubica con `stage.clientWidth / W`, así que tiene
  // que ser el elemento cuyo ancho coincide con el ancho renderizado del canvas.
  const escenario = contenedor?.querySelector<HTMLElement>('.prologo__stage');
  const lienzo = contenedor?.querySelector<HTMLCanvasElement>('.prologo__canvas');
  const ctx = lienzo?.getContext('2d');
  const mascota = contenedor?.querySelector<HTMLElement>('.prologo__mascot');
  const saltar = contenedor?.querySelector<HTMLButtonElement>('.prologo__skip');
  const pausa = contenedor?.querySelector<HTMLButtonElement>('.prologo__pause');
  const habla = contenedor?.querySelector<HTMLButtonElement>('.prologo__voice');
  const suena = contenedor?.querySelector<HTMLButtonElement>('.prologo__sound');
  const pantalla = contenedor?.querySelector<HTMLButtonElement>('.prologo__full');
  const veloz = contenedor?.querySelector<HTMLButtonElement>('.prologo__speed');
  if (
    !contenedor ||
    !escenario ||
    !lienzo ||
    !ctx ||
    !mascota ||
    !saltar ||
    !pausa ||
    !habla ||
    !suena ||
    !pantalla ||
    !veloz
  ) {
    // Sin prólogo hay que seguir igual: `alTerminar` es el empalme que arranca la construcción de
    // Tusi. Devolver un no-op sin llamarlo dejaba la landing congelada para siempre, con el clima
    // ya elegido y nada pasando, que es peor que no tener prólogo.
    opts.alTerminar();
    return () => undefined;
  }

  // Reasignados a constantes ya estrechadas: el motor son cien closures que dibujan, y sin esto
  // cada una tendría que volver a preguntar si el contexto existe.
  const raiz = contenedor;
  const c = lienzo;
  const g = ctx;
  const mascotaEl = mascota;
  const skipEl = saltar;
  const btnPausa = pausa;
  const btnVoz = habla;
  const btnSonido = suena;
  const btnPantalla = pantalla;
  const btnVelocidad = veloz;
  const stage = escenario;

  const W = c.width;
  const H = c.height;
  const CX = W / 2;
  const CY = H / 2;

  /**
   * Si los personajes hablan. Es del prólogo y va DEBAJO de la preferencia global de sonido: con el
   * sonido apagado no suena nada, con las voces apagadas la escena sigue sonando sin diálogo.
   */
  let voces = true;

  /**
   * El reloj va SIEMPRE a ritmo de lectura. Con la voz del sistema dependía de que la máquina tuviera
   * voces en español: la misma escena duraba distinto según dónde se abriera, y cuando las voces
   * llegaban tarde había que rearmarla con la escena ya andando. Los blips del director caben en
   * cualquier ventana, así que el ritmo ya no tiene por qué depender del audio.
   */
  const reloj: readonly LineaEnReloj[] = armarReloj(GUION, false);
  const T: Anclajes = anclajesDe(reloj);

  const linea = (id: string): LineaEnReloj => {
    const encontrada = reloj.find((l) => l.id === id);
    if (!encontrada) throw new Error(`prologo: falta la línea "${id}"`);
    return encontrada;
  };

  // Los momentos del acto de adentro que el dibujo acompaña, atados a la línea que los dispara.
  const BALA = { t0: linea('dentro-cuidado').t0 - 300, t1: linea('dentro-cuidado').t0 + 1300 };
  const ADENTRO = { lanza: linea('dentro-escapemos').t0, frena: linea('dentro-esquivar').t0 };

  const ESTILO: Record<Hablante, Estilo> = {
    // Tres voces, tres alturas fijas. Que cada tripulante hable siempre desde el mismo renglón
    // es lo que deja seguir la conversación sin poner nombres.
    // Las dos escoltas comparten renglón, una a cada lado: se leen como pares, y ninguna llega
    // al rincón de abajo a la derecha, donde vive el botón de saltar.
    cap: { y: 0.78, x: 0.5, tam: 26, color: '#eef1f4', fuente: 'mono' },
    naveA: { y: 0.85, x: 0.28, tam: 23, color: '#c4cddb', fuente: 'mono' },
    naveB: { y: 0.85, x: 0.72, tam: 23, color: '#c4cddb', fuente: 'mono' },
    // La exploradora habla desde arriba, que es donde está: su voz viene de otro lado, y su
    // color es el mismo de su casco. A 0,16 el renglón le tocaba el casco (medido: 13 px adentro
    // en "¿por qué van hacia ahí?"), y como comparten color se leía como un solo borrón.
    // 0,20: la franja libre entre su nave (que sube de 0,30 a 0,11 mientras escapa) y la escena
    // que ocurre abajo. A 0,23 le cruzaba su propio casco; a 0,40 tapaba las naves arrastradas y la
    // anomalía, que es lo único que hay que mirar en ese momento.
    nave4: { y: 0.2, x: 0.62, tam: 25, color: '#7fd6bd', fuente: 'mono' },
    // El grito va al centro y grande. Cae antes de que existan las moléculas, así que ahí no
    // pisa nada: es el único que se permite el medio de la pantalla.
    todos: { y: 0.5, x: 0.5, tam: 44, color: '#f6d9c0', fuente: 'mono' },
    // Arriba y ancha: no tiene cuerpo, así que no puede salir del centro, que es donde están las
    // moléculas. Ahí encima quedaba pegada al dibujo.
    voz: { y: 0.19, x: 0.5, tam: 34, color: '#f0b458', fuente: 'serif' },
    // A 0,8 el bloque de tres renglones se metía 8 px adentro de la mascota: el bloque crece
    // hacia ARRIBA desde su centro, así que la frase más larga es justo la que la toca.
    mascota: { y: 0.825, x: 0.5, tam: 28, color: '#f4ece0', fuente: 'serif' },
  };
  // 12 cuerdas, no 9: de cerca la mitad de los puntos queda fuera de cuadro, y con pocos la
  // línea "apenas puedo esquivar las partículas" no tiene con qué respaldarse.
  const N = 12;

  const CUERDAS = Array.from({ length: N }, (_, k) => bisectAngle(k));

  /**
   * Desfase y velocidad propios de cada cuerda. Acá está el caos: en el par de Tusi el círculo
   * aparece PORQUE los movimientos están sincronizados, así que mientras cada punto va a su
   * ritmo no hay figura que ver, solo bolas cruzándose. Números fijos, no aleatorios en cada
   * cuadro: el caos tiene que ser el mismo cada vez que lo mirás.
   */
  // Un valor por cuerda: si la tabla queda corta, las últimas dan NaN y sus puntos desaparecen.
  /**
   * Posiciones de las partículas del cuadro actual. `patron` las anota al dibujarlas y las naves
   * las leen para esquivar de verdad: antes la sacudida era genérica y no reaccionaba a nada, así
   * que una bola les pasaba por encima y seguían derecho.
   */
  let PUNTOS: Punto[] = [];

  const DESFASE = [0, 2.31, 4.87, 1.06, 5.42, 3.19, 0.74, 2.95, 4.13, 1.72, 3.86, 5.09];
  const VELOCIDAD = [1, 1.47, 0.72, 1.83, 0.61, 1.29, 1.68, 0.86, 1.12, 1.05, 0.79, 1.55];

  const ESTRELLAS = Array.from({ length: 150 }, (_, i) => ({
    x: ((i * 97) % 1000) / 1000,
    y: ((i * 61) % 562) / 562,
    z: 0.3 + ((i * 37) % 100) / 140,
    // Fase propia del titileo. Sin esto las 150 laten juntas y se lee como un parpadeo de la
    // pantalla entera en vez de como un cielo.
    f: ((i * 173) % 628) / 100,
  }));

  /* ---------------------------------------------------------------------------------------
   * SONIDO. Sintetizado, sin un solo archivo, y sobre la salida común del director de sonido
   * (`libs/sonido.ts`) en vez de un contexto propio: uno solo para toda la app, abierto con el
   * primer gesto, que ya sabe quedarse callado si no hay Web Audio o si el sonido está apagado.
   * Mientras no haya salida el prólogo corre igual, mudo: nada de lo que se ve depende de que suene.
   * ------------------------------------------------------------------------------------ */
  let red: RedDeAudio | null = null;
  /** Lo que ya sonó o se dijo una sola vez, por id de línea o por hito. */
  let dichas = new Set<string>();

  /**
   * La red del prólogo sobre la salida común, armada la primera vez que hay dónde sonar. Se pide en
   * cada cuadro a propósito: si el audio se destraba o se prende con la escena ya andando, el
   * zumbido entra solo en vez de quedar mudo hasta la próxima visita. Terminado, no se rearma: un
   * pip tardío levantaba un zumbido nuevo sobre el recorrido.
   */
  function abrirAudio(): RedDeAudio | null {
    if (terminado) return null;
    const salida = sonido().salida();
    if (!salida) return null;
    if (red) return red;
    const ac = salida.ctx;
    const master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(salida.salida);

    // El zumbido de la anomalía: grave, y se abre el filtro a medida que se acercan.
    const zumbido = ac.createOscillator();
    zumbido.type = 'sawtooth';
    zumbido.frequency.value = 46;
    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 120;
    const zumbidoGain = ac.createGain();
    zumbidoGain.gain.value = 0;
    zumbido.connect(filtro).connect(zumbidoGain).connect(master);
    zumbido.start();
    red = { master, zumbido, zumbidoGain, filtro };
    return red;
  }

  /**
   * El contexto es de toda la app y NO se cierra: se corta el zumbido (un oscilador continuo que con
   * la ganancia en 0 igual seguía procesando en el hilo de audio el resto de la sesión) y la red se
   * desconecta de la salida común.
   */
  function soltarAudio(): void {
    if (!red) return;
    red.zumbido.stop();
    red.zumbido.disconnect();
    red.master.disconnect();
    red = null;
  }

  function pip(freq: number, dur: number, tipo: OscillatorType, vol: number): void {
    const r = abrirAudio();
    if (!r) return;
    const ac = r.master.context;
    const master = r.master;
    const o = ac.createOscillator();
    const gg = ac.createGain();
    o.type = tipo || 'sine';
    o.frequency.value = freq;
    const n = ac.currentTime;
    gg.gain.setValueAtTime(0, n);
    gg.gain.linearRampToValueAtTime(vol === undefined ? 0.12 : vol, n + 0.012);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(gg).connect(master);
    o.start(n);
    o.stop(n + dur + 0.05);
  }

  /** Ráfaga de ruido: sirve para el salto y para el impacto. */
  function ruido(dur: number, desde: number, hasta: number, vol: number): void {
    const r = abrirAudio();
    if (!r) return;
    const ac = r.master.context;
    const master = r.master;
    const largo = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, largo, ac.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) dat[i] = (Math.random() * 2 - 1) * (1 - i / largo);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    const n = ac.currentTime;
    bp.frequency.setValueAtTime(desde, n);
    bp.frequency.exponentialRampToValueAtTime(hasta, n + dur);
    const gg = ac.createGain();
    gg.gain.value = vol;
    src.connect(bp).connect(gg).connect(master);
    src.start(n);
  }
  const reducido = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
  /**
   * Abajo de este ancho el lienzo queda tan chico que el dialogo cae a nueve pixeles: la cinematica
   * no se puede seguir y ademas se lleva minutos por delante. Se saltea entera, igual que con
   * movimiento reducido. Mostrarla rota seria peor que no mostrarla.
   */
  const angosto = (): boolean => innerWidth < 700;
  const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
  const ease = (v: number): number => (v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2);

  function mezcla(a: string, b: string, p: number): string {
    const n = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = n(a),
      [r2, g2, b2] = n(b);
    return `rgb(${Math.round(r1 + (r2 - r1) * p)},${Math.round(g1 + (g2 - g1) * p)},${Math.round(b1 + (b2 - b1) * p)})`;
  }

  function estrellas(t: number, alfa: number, warp: number): void {
    if (alfa <= 0.01) return;
    for (const s of ESTRELLAS) {
      const x = ((s.x * W + t * 0.012 * s.z) % (W + 40)) - 20;
      const y = s.y * H;
      // TITILAN. Ya derivaban, pero son 150 puntos de 1,6 px en todo el lienzo: en cualquier zona
      // chica no pasa ninguna en nueve segundos, asi que el fondo se lee quieto. Medido en el tramo
      // del pacto daba 0,03 de amplitud, o sea la mascota respiraba sobre un cielo muerto.
      const titila = 0.72 + 0.28 * Math.sin(t * 0.0021 + s.f);
      g.globalAlpha = alfa * (0.18 + s.z * 0.5) * titila;
      if (warp > 0.01) {
        // Estelas radiales al entrar en la luz: el salto ES el zoom, no un corte de cámara.
        const dx = x - CX,
          dy = y - CY;
        const d = Math.hypot(dx, dy) || 1;
        const largo = warp * (50 + s.z * 260);
        g.strokeStyle = '#dfe7f2';
        g.lineWidth = 1.1 * s.z;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (dx / d) * largo, y + (dy / d) * largo);
        g.stroke();
      } else {
        g.fillStyle = '#cfd6e0';
        g.fillRect(x, y, 1.6 * s.z, 1.6 * s.z);
      }
    }
    g.globalAlpha = 1;
  }

  /**
   * El punto de luz al que van. Está desde el primer cuadro: sin esto la maraña aparecía de la
   * nada al llegar el zoom, y las naves volaban hacia ninguna parte. Se apaga a medida que el
   * zoom la resuelve, porque ya no hace falta insinuar lo que se ve.
   */
  function faro(t: number, alfa: number): void {
    if (alfa <= 0.01) return;
    const r = (24 + Math.sin(t * 0.0012) * 5) * alfa;
    const rg = g.createRadialGradient(CX, CY, 0, CX, CY, r * 3.2);
    rg.addColorStop(0, `rgba(255,244,222,${0.95 * alfa})`);
    rg.addColorStop(0.3, `rgba(235,155,60,${0.32 * alfa})`);
    rg.addColorStop(1, 'rgba(47,154,128,0)');
    g.save();
    g.fillStyle = rg;
    g.fillRect(CX - r * 3.2, CY - r * 3.2, r * 6.4, r * 6.4);
    g.restore();
  }

  /**
   * La exploradora. Va ADELANTE, es más chica y de otro color: se lee como otra cosa desde el
   * primer cuadro, sin que nadie tenga que explicarlo. Y es la única que no cae: se adelantó
   * tanto que la anomalía la agarra de costado, así que queda afuera viendo cómo se llevan a los
   * otros tres. Por eso sus cuatro preguntas no tienen respuesta.
   */
  function exploradora(t: number): void {
    if (t > T.zoom + 400) return;
    const p = clamp01(t / T.anomalia);
    // Sigue de largo hacia arriba a la derecha: escapa del tirón en vez de caer en él.
    const escapa = clamp01((t - T.anomalia) / 9000);
    const x = W * (0.34 + p * 0.24 + escapa * 0.22);
    const y = H * (0.3 - p * 0.05 - escapa * 0.14);
    // Impaciente: adelanta y frena, como esperando a los otros. Es lo ÚNICO que la mueve: a ella
    // la anomalía no la agarra, así que no tiembla. Antes le aplicaba la misma sacudida que a los
    // otros tres, y eso la mostraba sufriendo un tirón que no la estaba tocando.
    const tiron = Math.sin(t * 0.0016) * 14;
    const a = 1 - clamp01((t - T.zoom) / 400);

    g.save();
    g.globalAlpha = a;
    g.translate(x + tiron, y);
    g.scale(0.85, 0.85);
    // Silueta más larga y afilada, con aletas: no es una del trío.
    g.strokeStyle = '#62c4ad';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(19, 0);
    g.lineTo(-9, -4);
    g.lineTo(-4, 0);
    g.lineTo(-9, 4);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.moveTo(-4, -3);
    g.lineTo(-14, -10);
    g.moveTo(-4, 3);
    g.lineTo(-14, 10);
    g.stroke();
    g.fillStyle = 'rgba(98,196,173,0.95)';
    g.beginPath();
    g.arc(-11, 0, 2.4, 0, 7);
    g.fill();
    g.restore();
  }

  /** Formación en cuña: el líder adelante, dos escoltas atrás. Desfases propios para que respire. */
  const FORMACION = [
    { dx: 0, dy: 0, bob: 0 },
    { dx: -46, dy: -30, bob: 1.9 },
    { dx: -46, dy: 30, bob: 3.7 },
  ];

  /**
   * Tres tramos. ENTRAN por la izquierda derecho a la bola de luz y se meten adentro (se achican
   * y se apagan al ser tragadas); el salto ocurre AHÍ, no por reloj. Reaparecen ADENTRO de la
   * maraña, derivando mientras miran. Y en el último beat SALEN, y la cámara se va con ellas.
   */

  /**
   * Los operadores que disparan cuando el capitán da la orden. Salen del casco de cada nave, van
   * derecho a la anomalía y se APAGAN antes de llegar: es el argumento del nivel 0 puesto en
   * imagen, no una decoración. Desplegaron todo lo que tenían y no alcanzó, y por eso la línea
   * siguiente puede ser "no funcionará, es demasiado lento" sin que nadie lo explique.
   *
   * Cada bolita nace en la posición REAL de su nave en el instante en que se dispara, calculada
   * con `antesDelSalto`, así que la escena sigue siendo la misma si saltás a este momento.
   */
  const OPERADORES = [
    { nave: 0, txt: 'switchMap', d: 0, lado: -1 },
    { nave: 1, txt: 'retry', d: 760, lado: 1 },
    { nave: 2, txt: 'mergeMap', d: 1520, lado: -1 },
    { nave: 0, txt: 'catchError', d: 2280, lado: 1 },
    { nave: 1, txt: 'concatMap', d: 3040, lado: -1 },
    { nave: 2, txt: 'takeUntil', d: 3800, lado: 1 },
    { nave: 0, txt: 'debounceTime', d: 4560, lado: -1 },
  ];
  /** La segunda descarga: los pipes, cuando alguien dice que están recargando. */
  const PIPES = [
    { nave: 1, txt: 'pipe', d: 0, lado: 1 },
    { nave: 2, txt: 'pipe', d: 620, lado: -1 },
    { nave: 0, txt: 'pipe', d: 1240, lado: 1 },
    { nave: 1, txt: 'pipe', d: 1860, lado: -1 },
    { nave: 2, txt: 'pipe', d: 2480, lado: 1 },
  ];
  // Cuatro y bien separadas, no seis encimadas. Con seis a 1700 ms habia CINCO vivas a la vez y las
  // etiquetas se pisaban hasta leerse "mergeMapetryrror": el nombre del operador ES el contenido de
  // este beat, asi que ilegible equivale a no haberlo dibujado. Vuelo < separacion => nunca mas de
  // dos en pantalla.
  const VUELO = 1400;

  function operadores(t: number): void {
    descarga(t, OPERADORES, linea('anom-rxjs').t0 + 400);
    descarga(t, PIPES, linea('anom-pipes').t0 + 300);
  }

  function descarga(
    t: number,
    tanda: readonly { nave: number; txt: string; d: number; lado: number }[],
    desde: number,
  ): void {
    const ultima = tanda[tanda.length - 1].d;
    if (t < desde || t > desde + ultima + VUELO) return;
    g.save();
    g.font = '11px "JetBrains Mono","Cascadia Mono",Consolas,ui-monospace,monospace';
    g.textAlign = 'left';
    for (const op of tanda) {
      const p = clamp01((t - (desde + op.d)) / VUELO);
      if (p <= 0 || p >= 1) continue;
      const cuna = antesDelSalto(desde + op.d);
      const f = FORMACION[op.nave];
      const ox = cuna.x + f.dx * cuna.s,
        oy = cuna.y + f.dy * cuna.s;
      // Van al centro pero se quedan a mitad de camino: nunca lo tocan.
      const avance = ease(p) * 0.6;
      let x = ox + (CX - ox) * avance,
        y = oy + (CY - oy) * avance;
      // Se abren en abanico: en línea recta las seis pisaban el mismo camino.
      const dx = CX - ox,
        dy = CY - oy,
        d = Math.hypot(dx, dy) || 1;
      x += (-dy / d) * op.lado * 40 * p;
      y += (dx / d) * op.lado * 40 * p;
      // Se apagan en el último tercio: se disolvieron, no llegaron.
      const vida = clamp01(p / 0.12) * clamp01((1 - p) / 0.4);
      g.globalAlpha = vida;
      g.fillStyle = '#7fd6bd';
      g.beginPath();
      g.arc(x, y, 4.4 - p * 1.8, 0, 7);
      g.fill();
      g.globalAlpha = vida * 0.7;
      g.fillStyle = 'rgba(190,232,220,0.9)';
      g.fillText(op.txt, x + 8, y + (op.lado < 0 ? -6 : 13));
    }
    g.restore();
  }

  /**
   * Dónde está la formación ANTES del salto, como función pura de t. Está afuera de `naves()` a
   * propósito: los operadores que disparan tienen que salir del casco, y para eso necesitan la
   * posición del instante en que se disparan sin depender del cuadro que se esté dibujando. Puro
   * significa además que saltar a cualquier momento sigue dando lo mismo que reproducir hasta ahí.
   */
  function antesDelSalto(t: number): { x: number; y: number; s: number; a: number } {
    const ENTRADA = T.zoom;
    let x,
      y,
      s,
      arrastre = 0;
    if (t < T.anomalia) {
      // CRUCERO: vuelven a casa, sin apuro. Nada los está tirando todavía.
      const p = t / T.anomalia;
      x = W * (0.12 + p * 0.16);
      y = H * (0.42 - p * 0.04);
      s = 1;
    } else {
      // ARRASTRE: la anomalía los tira al centro y el sistema ya no corrige. Es el mismo "no
      // responden a tiempo" que dicen por radio, pero visto.
      const p = Math.pow(clamp01((t - T.anomalia) / (ENTRADA - T.anomalia)), 1.9);
      const x0 = W * 0.28,
        y0 = H * 0.38;
      x = x0 + (CX - x0) * p;
      y = y0 + (CY - y0) * p;
      s = 1 - p * 0.86;
      arrastre = p;
    }
    // El temblor arranca ANTES del arrastre y es perceptible enseguida: primero se siente, después
    // alguien pregunta. Con la curva del arrastre sola, a los 600 ms de la primera línea de alarma
    // la sacudida medía 0,02 px, o sea nada.
    const tiembla = clamp01((t - T.temblor) / 1800);
    const sacude = tiembla * 3.5 + arrastre * 16;
    x += Math.sin(t * 0.021) * sacude + Math.sin(t * 0.047) * sacude * 0.4;
    y += Math.cos(t * 0.017) * sacude + Math.cos(t * 0.039) * sacude * 0.4;
    return { x, y, s, a: 1 - clamp01((t - (ENTRADA - 500)) / 500) };
  }

  function naves(t: number): void {
    const REAPARECE = T.zoom + 900;
    const salida = clamp01((t - T.orden) / 3200);
    let x,
      y,
      s,
      a = 1;
    if (t < REAPARECE) {
      const b = antesDelSalto(t);
      x = b.x;
      y = b.y;
      s = b.s;
      a = b.a;
    } else if (salida <= 0) {
      // Adentro: aparecen otra vez, chicas, flotando entre las líneas. Arriba a la izquierda,
      // FUERA de la banda central donde va el diálogo: ahí se les encimaba el texto.
      const e = clamp01((t - REAPARECE) / 700);
      x = W * 0.24 + Math.sin(t * 0.0007) * 18;
      y = H * 0.24 + Math.sin(t * 0.0011 + 1.3) * 11;
      // Esquivando: mientras dice que apenas puede evitar las partículas, el movimiento tiene
      // que ser brusco. Flotando tranquila, la línea suena a excusa.
      // Atado a T.zoom, no a un reloj absoluto: si el diálogo de antes crece, la sacudida tiene
      // que seguir empezando justo antes de entrar, no quedarse en el segundo que era.
      const esq = clamp01((t - (T.zoom - 1300)) / 900) * clamp01((T.fusion + 1400 - t) / 1000);
      x += (Math.sin(t * 0.009) * 26 + Math.sin(t * 0.021) * 12) * esq;
      y += (Math.cos(t * 0.011) * 18 + Math.cos(t * 0.019) * 9) * esq;
      // Se LANZAN hacia adelante cuando el capitán decide escapar, y frenan de golpe al ver lo
      // que se les vino encima, justo cuando ella dice que apenas puede esquivar: el impulso no se
      // meten en él.
      const lanza = ease(clamp01((t - ADENTRO.lanza) / 1100));
      const frena = ease(clamp01((t - ADENTRO.frena) / 500));
      x += (lanza - frena) * W * 0.19;
      y -= (lanza - frena) * H * 0.05;
      s = 0.6 * e;
      a = e;
    } else {
      // Continúa exactamente desde donde estaba: sin salto entre las dos ramas.
      x = W * 0.24 + salida * W * 0.48;
      y = H * 0.24 - salida * H * 0.08;
      s = 0.6 - salida * 0.52;
    }
    if (s <= 0.04 || a <= 0.02) return;
    g.save();
    g.globalAlpha = a;

    // Adentro rompen formación: no tiene sentido volar prolijo esquivando.
    const suelta = t > REAPARECE && salida <= 0 ? 1 : 0;

    FORMACION.forEach((f, i) => {
      // Cada una respira aparte: en formación rígida se ven pegadas, como un solo objeto.
      const abre = 1 + suelta * 2.2;
      let px = x + f.dx * s * abre + Math.sin(t * 0.0013 + f.bob) * (5 + suelta * 22) * s;
      let py = y + f.dy * s * abre + Math.cos(t * 0.0016 + f.bob) * (4 + suelta * 18) * s;

      // ESQUIVA: se apartan de las partículas que tienen encima, con fuerza inversa a la
      // distancia. Es lo que hace que la maniobra se corresponda con lo que está pasando en
      // pantalla, en vez de ser un temblor decorativo.
      let ex = 0,
        ey = 0;
      if (suelta) {
        const RADIO = 95;
        for (const p of PUNTOS) {
          const dx = px - p.x,
            dy = py - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIO * RADIO && d2 > 4) {
            const d = Math.sqrt(d2);
            const fuerza = 1 - d / RADIO;
            ex += (dx / d) * fuerza;
            ey += (dy / d) * fuerza;
          }
        }
        px += ex * 46;
        py += ey * 46;
      }

      g.save();
      g.translate(px, py);
      // Se inclinan hacia donde escapan: sin esto la maniobra se lee como deslizarse de costado.
      if (suelta) g.rotate(Math.max(-0.5, Math.min(0.5, ey * 0.55)));
      g.scale(s, s);
      g.strokeStyle = i === 0 ? '#e7ecf3' : 'rgba(231,236,243,0.72)';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(14, 0);
      g.lineTo(-10, -7);
      g.lineTo(-5, 0);
      g.lineTo(-10, 7);
      g.closePath();
      g.stroke();
      g.fillStyle = 'rgba(235,155,60,0.9)';
      g.beginPath();
      g.arc(-11, 0, 2.6, 0, 7);
      g.fill();
      g.restore();
    });
    g.restore();
  }

  /**
   * La bola que dispara el grito. Viene DERECHO a donde están, y por eso las dos avisan a la vez.
   * Se mete en `PUNTOS` como cualquier otra partícula: la esquiva no es una animación aparte, la
   * hace el mismo mecanismo que ya las aparta del resto. Si mañana pasa más cerca o más lejos, la
   * maniobra cambia sola.
   */
  function bala(t: number): void {
    if (t < BALA.t0 || t > BALA.t1) return;
    const p = clamp01((t - BALA.t0) / (BALA.t1 - BALA.t0));
    // Cruza en diagonal por donde derivan las naves, de abajo a la derecha hacia arriba a la izquierda.
    // La trayectoria está resuelta para PASAR por donde derivan las naves (0.24W, 0.24H): con la
    // diagonal anterior les pasaba a 94 px, justo en el borde del radio de esquiva, así que casi
    // no las movía y el grito quedaba sin causa visible.
    const en = (q: number): { x: number; y: number } => ({
      x: W * (1.06 - q * 1.28),
      y: H * (0.64 - q * 0.62),
    });
    const ahora = en(p),
      antes = en(Math.max(0, p - 0.1));
    PUNTOS.push({ x: ahora.x, y: ahora.y, r: 15 });

    g.save();
    // La estela es lo que la hace leer como RÁPIDA: la misma bola sin estela se lee como grande.
    const estela = g.createLinearGradient(antes.x, antes.y, ahora.x, ahora.y);
    estela.addColorStop(0, 'rgba(235,155,60,0)');
    estela.addColorStop(1, 'rgba(235,155,60,0.5)');
    g.strokeStyle = estela;
    g.lineWidth = 10;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(antes.x, antes.y);
    g.lineTo(ahora.x, ahora.y);
    g.stroke();
    g.fillStyle = '#f2b96b';
    g.beginPath();
    g.arc(ahora.x, ahora.y, 12, 0, 7);
    g.fill();
    g.restore();
  }

  function patron(
    t: number,
    zoom: number,
    alfa: number,
    cuantas: number,
    sync: number,
    oscuro: boolean,
    circulo: number,
    fusion: Fusion | null,
  ): void {
    if (alfa <= 0.01) return;
    const R = 210 * zoom;
    // De cerca los puntos son bolas; de lejos, puntitos. Es lo que hace que el mismo dibujo se
    // lea como maraña o como patrón.
    const rp = 4.2 * Math.min(zoom, 2.4);
    const base = t * 0.0011;

    g.save();
    g.globalAlpha = alfa;
    for (let i = 0; i < Math.min(N, cuantas); i++) {
      const th = CUERDAS[i];
      // Recién entrada: se dibuja creciendo desde el centro, para que se vea NACER.
      const nace = sync < 0.02 ? 1 : clamp01((cuantas - i) * 0.9);
      const r = R * ease(Math.min(1, nace));
      // Mientras los puntos se van juntando, las líneas se apagan: lo que importa son las bolas.
      g.globalAlpha = alfa * (fusion ? 1 - fusion.p : 1);
      g.strokeStyle = oscuro ? 'rgba(180,186,178,0.42)' : 'rgba(120,116,104,0.34)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(CX + Math.cos(th) * r, CY + Math.sin(th) * r);
      g.lineTo(CX - Math.cos(th) * r, CY - Math.sin(th) * r);
      g.stroke();
      g.globalAlpha = alfa * (fusion ? fusion.vivo : 1);

      // Cada punto a su ritmo mientras hay caos; al alejarse las fases CONVERGEN a una sola y
      // ahí, por sincronía, aparece la figura. Ese acomodarse es el "ah" del beat 6.
      const suelto = base * VELOCIDAD[i] + DESFASE[i] + Math.sin(t * 0.0021 + i * 2.7) * 0.45;
      const ph = suelto + (base - suelto) * ease(sync);

      // s = R·cos(ph − θ), el mismo MAS puro de dotOffset().
      for (const signo of [1, -1]) {
        const s = Math.cos(ph - th) * r * signo;
        let px = CX + Math.cos(th) * s;
        let py = CY + Math.sin(th) * s;

        // Los mismos puntos que venían cruzándose se van a orbitar uno de los dos núcleos, cada
        // color al suyo. No nacen átomos nuevos: se ARMAN con lo que ya estaba en pantalla.
        if (fusion) {
          const nucleo = signo > 0 ? fusion.a : fusion.b;
          const giro = t * 0.004 * signo + i * 0.8;
          const radio = 26 + (i % 3) * 10;
          const tx = nucleo.x + Math.cos(giro) * radio;
          const ty = nucleo.y + Math.sin(giro) * radio * 0.4;
          // `p` YA viene con su curva: volver a suavizar acá congelaba el arranque.
          px += (tx - px) * fusion.p;
          py += (ty - py) * fusion.p;
        }

        g.fillStyle = signo > 0 ? '#eb9b3c' : '#2f9a80';
        g.beginPath();
        g.arc(px, py, rp, 0, 7);
        g.fill();
        PUNTOS.push({ x: px, y: py, r: rp });
      }
    }
    g.globalAlpha = alfa;
    const ph = base;

    // El premio: los puntos de un mismo color caen sobre un círculo de radio R/2 que rueda.
    // Es `emergentCircleCenter` de tu tusi-math, y recién se puede VER desde lejos.
    if (circulo > 0.01) {
      g.globalAlpha = alfa * circulo;
      for (const signo of [1, -1]) {
        g.strokeStyle = signo > 0 ? '#eb9b3c' : '#2f9a80';
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(
          CX + (signo * R * Math.cos(ph)) / 2,
          CY + (signo * R * Math.sin(ph)) / 2,
          R / 2,
          0,
          7,
        );
        g.stroke();
      }
    }
    g.restore();
  }

  function atomo(x: number, y: number, r: number, alfa: number, giro: number, color: string): void {
    if (alfa <= 0.01) return;
    g.save();
    g.globalAlpha = alfa;
    g.translate(x, y);
    g.rotate(giro);
    g.strokeStyle = color;
    g.lineWidth = 1.4;
    for (const rot of [0, Math.PI / 3, -Math.PI / 3]) {
      g.save();
      g.rotate(rot);
      g.beginPath();
      g.ellipse(0, 0, r, r * 0.4, 0, 0, 7);
      g.stroke();
      g.restore();
    }
    g.fillStyle = color;
    g.beginPath();
    g.arc(0, 0, r * 0.28, 0, 7);
    g.fill();
    g.restore();
  }

  function texto(
    str: string,
    y: number,
    alfa: number,
    tam: number,
    color?: string,
    xf?: number,
    fuente?: 'mono' | 'serif',
  ): void {
    if (alfa <= 0.01) return;
    g.save();
    g.globalAlpha = alfa;
    g.fillStyle = color || '#eef1f4';
    // Las naves hablan en mono, como una radio; la voz que todavía no tiene cuerpo, en serif.
    const x = W * (xf === undefined ? 0.5 : xf);
    g.font =
      fuente === 'mono'
        ? `${tam}px "JetBrains Mono","Cascadia Mono",Consolas,ui-monospace,monospace`
        : `${tam}px "Fraunces","Palatino Linotype",Georgia,serif`;
    g.textAlign = 'center';
    // Respeta el corte explícito con \n; si no hay, corta por ANCHO REAL medido con la fuente ya
    // puesta. Antes cortaba a los 46 caracteres a secas, y 46 caracteres en mono de 26 px no miden
    // lo mismo que en serif de 28: la frase final se partía sola y dejaba "inalcanzable" sola en
    // un renglón.
    const maxAncho = W * 0.86;
    const lineas = [];
    for (const parrafo of str.split('\n')) {
      let linea = '';
      for (const p of parrafo.split(' ')) {
        const prueba = (linea + ' ' + p).trim();
        if (linea && g.measureText(prueba).width > maxAncho) {
          lineas.push(linea);
          linea = p;
        } else linea = prueba;
      }
      lineas.push(linea);
    }
    // Centrado vertical sobre `y`: con dos renglones, si no, el bloque cae corrido hacia abajo.
    const alto = (lineas.length - 1) * (tam * 1.35);
    lineas.forEach((l, i) => g.fillText(l, x, y - alto / 2 + i * (tam * 1.35)));
    g.restore();
  }

  /** La mascota es un <img> encima del canvas: se ubica en coordenadas del canvas escaladas. */
  /**
   * El pulso cálido de la lamparita que la mascota sostiene, dibujado DETRÁS de ella. La mascota es
   * un <img> y no se le puede animar una parte por dentro, así que la señal de vida va en el
   * lienzo. Late lento y no la ilumina de más: durante el pacto ella habla catorce líneas quieta, y
   * sin esto el tramo se lee como una foto sobre negro en vez de como alguien explicando.
   */
  function lamparita(t: number, x: number, y: number, nacida: number): void {
    if (nacida < 0.6) return;
    const pulso = 0.5 + 0.5 * Math.sin((t - T.choque) * 0.0016);
    const r = W * 0.042 * (0.86 + pulso * 0.24);
    // Arriba a la izquierda del cuerpo, que es donde el asset tiene la lámpara.
    const lx = x - W * 0.066;
    const ly = y - H * 0.077;
    const halo = g.createRadialGradient(lx, ly, 0, lx, ly, r);
    halo.addColorStop(0, `rgba(255,214,120,${(0.2 + pulso * 0.16) * nacida})`);
    halo.addColorStop(0.45, `rgba(255,190,90,${(0.08 + pulso * 0.07) * nacida})`);
    halo.addColorStop(1, 'rgba(255,190,90,0)');
    g.save();
    g.fillStyle = halo;
    g.beginPath();
    g.arc(lx, ly, r, 0, 7);
    g.fill();
    g.restore();
  }

  function ponerMascota(x: number, y: number, escala: number, alfa: number): void {
    const k = stage.clientWidth / W;
    const ancho = mascotaEl.clientWidth || stage.clientWidth * 0.18;
    mascotaEl.style.opacity = String(alfa);
    mascotaEl.style.transform = `translate(${x * k - ancho / 2}px, ${y * k - ancho / 2}px) scale(${escala})`;
  }

  function dibujar(t: number): void {
    // Se vacía cada cuadro: `patron` las vuelve a anotar y las naves las leen para esquivar.
    PUNTOS = [];

    const fondo = clamp01((t - T.orden) / 3400);
    g.fillStyle = fondo > 0 ? mezcla('#07080c', '#f4f2ea', ease(fondo)) : '#07080c';
    g.fillRect(0, 0, W, H);

    // El arco de cámara ES el argumento: encima del patrón no se entiende nada, y el orden
    // aparece recién al alejarse. El caos era un problema de distancia, no del dibujo.
    // 2.8 y no 3.4: medido, a 3.4 solo 9 de los 24 puntos caen dentro del cuadro y la escena de
    // esquivar queda vacía. A 2.8 entran 12 y las líneas siguen desbordando la pantalla.
    const CERCA = 2.8;
    const zoom =
      t < T.zoom
        ? 0.05 + clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.13
        : t < T.orden
          ? 0.16 + ease(clamp01((t - T.zoom) / 2200)) * (CERCA - 0.16)
          : // Termina en 0.88, no en 1: a escala completa el círculo de abajo se comía el título.
            CERCA - ease(clamp01((t - T.orden) / 3200)) * (CERCA - 0.88);
    // La anomalía está desde el primer cuadro como un punto entre las estrellas, y crece a
    // medida que se acercan: no aparece, se revela. Antes del arrastre casi no se ve.
    const patronAlfa =
      0.05 +
      clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.35 +
      clamp01((t - T.zoom + 400) / 1800) * 0.6;

    // El salto: las estrellas se estiran en el instante en que las naves entran en la luz.
    const warp = clamp01(1 - Math.abs(t - (T.zoom + 250)) / 850);
    estrellas(t, clamp01(1 - fondo * 1.2), warp);
    // El faro crece con el arrastre, se aviva al tragárselas y recién ahí se apaga.
    const crece = 0.25 + clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.75;
    faro(t, crece * clamp01(1 - (t - T.zoom - 400) / 1400) * (1 + warp * 1.4));

    if (warp > 0.01) {
      g.save();
      g.globalAlpha = warp * 0.5;
      const fl = g.createRadialGradient(CX, CY, 0, CX, CY, W * 0.6);
      fl.addColorStop(0, 'rgba(255,246,228,0.9)');
      fl.addColorStop(0.5, 'rgba(235,155,60,0.18)');
      fl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fl;
      g.fillRect(0, 0, W, H);
      g.restore();
    }

    const enOrden = t >= T.orden;
    const cuantas = enOrden ? clamp01((t - T.orden - 300) / 3600) * N + 0.6 : N;
    // La sincronización llega DESPUÉS de que la mascota lo dice: primero la afirmación, después
    // el sistema obedeciéndola. Si sincroniza antes, la frase queda explicando algo ya resuelto.
    const sync = clamp01((t - T.orden - 600) / 3000);
    const circulo = clamp01((t - T.orden - 2600) / 2000);

    // La frase del caos va en el CENTRO, que es donde está mirando cualquiera: ahí converge la
    // maraña y ahí está la nave. Como el enjambre pasa justo por ese punto, el patrón se corre a
    // segundo plano mientras la frase está en pantalla, igual que el título de acto del recorrido.
    // Cuánto pesa el diálogo ahora mismo: mientras alguien habla, el patrón se corre atrás.
    let aCaos = 0;
    for (const d of reloj) {
      if (t >= d.t0 && t < d.t1) {
        aCaos = Math.max(aCaos, clamp01((t - d.t0) / 500) * clamp01((d.t1 - t) / 450));
      }
    }

    /**
     * Beat 4 en tres tiempos, todo continuo: los puntos que venían cruzándose se JUNTAN en dos
     * nubes (una por color), esas nubes se condensan en dos átomos, y los átomos chocan. Nada
     * aparece de la nada; todo sale de lo que ya se estaba moviendo.
     */
    // Once segundos para juntar las bolas: la fusión ocurre POR DEBAJO del diálogo, tan lento
    // que casi no se nota que empezó. Para el choque las dos moléculas ya están armadas.
    // La nucleación dura EXACTAMENTE lo que dura el diálogo de la voz, porque es su cama: si una
    // de esas frases crece, las moléculas tardan más en juntarse en vez de quedarse esperando.
    // El acercamiento cuelga del CHOQUE, no del final del armado. Atado al armado, estirar el
    // diálogo estiraba también la nucleación: con el reclamo de la tripulación en el medio, las
    // moléculas tardarían medio minuto en juntarse y no se vería pasar nada. Ahora se arman en su
    // tiempo, esperan formadas lo que haga falta, y el último tramo cae siempre sobre el impacto.
    const ACERCA = 1400,
      CHOQUE = T.choque;
    const REUNION = Math.min(15000, Math.max(2000, CHOQUE - ACERCA - T.fusion));
    let fusion = null;
    if (t >= T.fusion && t < T.orden) {
      // Potencia < 1, no ease-in-out: la nucleación tiene que notarse DESDE la primera palabra
      // de ella, y una curva que arranca plana deja tres segundos en los que no pasa nada.
      const p = Math.pow(clamp01((t - T.fusion) / REUNION), 0.62);
      const acerca = ease(clamp01((t - (CHOQUE - ACERCA)) / ACERCA));
      const sep = 150 * (1 - acerca);
      // Al chocar, los puntos se apagan: quedaron absorbidos en la mascota.
      const vivo = 1 - clamp01((t - CHOQUE) / 260);
      fusion = { p, vivo, acerca, a: { x: CX - sep, y: CY }, b: { x: CX + sep, y: CY } };
    }

    patron(
      t,
      zoom,
      patronAlfa * (1 - aCaos * 0.62),
      Math.ceil(cuantas),
      sync,
      fondo < 0.5,
      circulo,
      fusion,
    );

    // Van DESPUÉS del patrón: están metidas adentro de la maraña, no detrás. Y se atenúan con el
    // diálogo, igual que el patrón: mientras alguien habla, nada compite con lo que dice.
    g.save();
    g.globalAlpha = 1 - aCaos * 0.4;
    // Antes que las naves: tiene que estar en PUNTOS para que ellas la esquiven este mismo cuadro.
    bala(t);
    naves(t);
    operadores(t);
    exploradora(t);
    g.restore();

    if (fusion) {
      // Los anillos y el núcleo entran temprano y despacio: para cuando las naves preguntan
      // quién habló, las dos moléculas ya se reconocen como tales. Y se atenúan con el diálogo,
      // igual que el patrón y las naves: mientras alguien habla, nada compite con lo que dice.
      const a = clamp01((fusion.p - 0.3) / 0.35) * fusion.vivo * (1 - aCaos * 0.45);
      atomo(fusion.a.x, fusion.a.y, 30, a, t * 0.002, '#eb9b3c');
      atomo(fusion.b.x, fusion.b.y, 30, a, -t * 0.002, '#2f9a80');

      // El destello del choque: corto y una sola vez, es el nacimiento.
      const destello = clamp01(1 - Math.abs(t - CHOQUE) / 320);
      if (destello > 0.01) {
        g.save();
        g.globalAlpha = destello * 0.85;
        const rg = g.createRadialGradient(CX, CY, 0, CX, CY, 190 * destello + 40);
        rg.addColorStop(0, 'rgba(255,255,255,0.95)');
        rg.addColorStop(0.4, 'rgba(235,155,60,0.5)');
        rg.addColorStop(1, 'rgba(47,154,128,0)');
        g.fillStyle = rg;
        g.fillRect(0, 0, W, H);
        g.restore();
      }
    }

    // Cada línea con su voz y en su lugar. Las dos preguntas de las escoltas salen desde
    // costados distintos: alcanza para que se lean como dos naves y no como una sola hablando.
    for (const d of reloj) {
      if (t < d.t0 || t >= d.t1) continue;
      const a = clamp01((t - d.t0) / PRESUPUESTO.entra) * clamp01((d.t1 - t) / PRESUPUESTO.sale);
      const e = ESTILO[d.quien];
      texto(d.txt, H * e.y, a, e.tam, e.color, e.x, e.fuente);

      // Al entrar la línea, una sola vez, habla quien la dice. Sin pip por línea: ese bip de chat
      // le pone un sonido de interfaz a algo que es gente hablando por radio. Las encimadas
      // (`junto`, `pisa`) suenan a la vez, igual que se ven: el director mezcla voces, no las
      // encola como el motor de voz del sistema, que dejaba el par un segundo detrás del dibujo.
      if (!dichas.has(d.id)) {
        dichas.add(d.id);
        if (voces) sonido().hablar(d.quien, d.txt, (d.t1 - d.t0) / velocidad);
      }
    }

    // La mascota sale DEL choque: crece desde el punto exacto donde se juntaron los dos átomos.
    if (t >= CHOQUE && t < T.orden) {
      const n = clamp01((t - CHOQUE) / 520);
      // Nace en el punto del choque y después SUBE un poco. Es lo que le deja lugar al bloque de
      // tres renglones de la frase final, que a esta altura le tocaba los pies, y de paso se lee
      // como que flota en vez de estar apoyada en el aire.
      const flota = ease(clamp01((t - CHOQUE - 400) / 1400)) * H * 0.075;
      // RESPIRA. Sin esto se plantaba en el centro y no se movia mas mientras suelta catorce
      // lineas: un minuto largo en el que el prologo dejaba de ser cine y pasaba a ser subtitulos
      // sobre negro. Es lento y chico a proposito, para que acompane el dialogo sin robarselo.
      const respira =
        Math.sin((t - CHOQUE) * 0.00105) * H * 0.011 * ease(clamp01((t - CHOQUE) / 1200));
      const late = 1 + Math.sin((t - CHOQUE) * 0.0009 + 1.1) * 0.018;
      const alto = CY - flota + respira;
      lamparita(t, CX, alto, n);
      ponerMascota(CX, alto, (0.25 + ease(n) * 0.85) * late, n);
    } else if (t >= T.orden) {
      // Se corre abajo a la izquierda: le deja el centro al patrón que se está construyendo.
      const q = ease(clamp01((t - T.orden) / 2600));
      ponerMascota(CX - q * (W * 0.34), CY - H * 0.075 + q * (H * 0.375), 1.1 - q * 0.35, 1);
    } else {
      mascotaEl.style.opacity = '0';
    }

    if (t > T.fin - 2600) {
      texto('Angular Signals', H * 0.93, clamp01((t - (T.fin - 2600)) / 1400), 44, '#201d16');
    }

    /* Sonido atado a lo que se ve: el zumbido crece con el arrastre, el salto suena al entrar en
       la luz, el impacto en el choque, y al final un acorde que resuelve. Los hitos se marcan
       aunque no suene nada: prender el sonido más tarde no puede disparar un salto que ya pasó. */
    const audio = abrirAudio();
    if (audio) {
      const cerca = clamp01((t - T.temblor) / (T.zoom - T.temblor));
      const dentro = t > T.zoom && t < T.orden ? 0.5 : 0;
      audio.zumbidoGain.gain.value = t < T.zoom ? cerca * 0.16 : dentro * 0.1 * (1 - fondo);
      audio.filtro.frequency.value = 110 + cerca * 700;
    }
    if (!dichas.has('salto') && t >= T.zoom) {
      dichas.add('salto');
      ruido(1.1, 220, 4200, 0.28);
      pip(70, 1.4, 'sine', 0.2);
    }
    if (!dichas.has('choque') && t >= CHOQUE) {
      dichas.add('choque');
      ruido(0.5, 1800, 160, 0.22);
      pip(58, 0.9, 'sine', 0.26);
    }
    // La resolución: los dos círculos apareciendo tienen su acorde.
    if (!dichas.has('final') && t >= T.orden + 2600) {
      dichas.add('final');
      // Por `luego`, no por setTimeout pelado: estos cuatro sobrevivían al cleanup y sonaban
      // sobre el recorrido si el prólogo se salteaba justo en la resolución.
      [220, 277, 330, 440].forEach((f, i) => luego(() => pip(f, 2.2, 'sine', 0.07), i * 160));
    }

    // El skip se invierte junto con el fondo y desaparece al llegar: ya no hay nada que saltar.
    raiz.classList.toggle('prologo--claro', fondo > 0.55);
    raiz.classList.toggle('prologo--saliendo', t >= T.fin - 200);
  }

  /* ── voces ───────────────────────────────────────────────────────────────────────────────────
     Blips sintetizados por el director, un timbre por personaje, al estilo de los RPG de texto. No
     dependen de qué voces tenga instaladas el sistema, así que suenan igual en cualquier máquina. */

  /** Timers del acorde final y de soltar la red de audio. Se limpian en el cleanup: son el único
   *  async del motor. */
  const timers = new Set<number>();

  const luego = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  function pintarVoces(): void {
    btnVoz.textContent = voces ? 'Voces: sí' : 'Voces: no';
    btnVoz.setAttribute('aria-pressed', String(voces));
  }

  /* ── reloj de reproducción ───────────────────────────────────────────────────────────────── */

  /** Timestamp del cuadro anterior. `null` al arrancar o al reanudar: ese cuadro no suma tiempo. */
  let anterior: number | null = null;
  /**
   * Generacion del loop. Cada `arrancar` o reanudación invalida a los anteriores: con DOS loops
   * vivos, los dos escribiendo `anterior` en el mismo cuadro, el delta de cada uno daba casi cero.
   * La escena se quedaba clavada en el primer segundo sin que nada pareciera roto.
   */
  let generacion = 0;
  /**
   * Velocidades para adelantar. Solo hacia arriba: el prólogo ya corre al ritmo al que se sigue, y
   * lo que alguien necesita a la segunda vuelta es llegar antes, no mirarlo en cámara lenta.
   */
  const VELOCIDADES = [1, 1.5, 2, 3];
  let velocidad = 1;
  let raf = 0;
  /** Dónde quedó el reloj: es lo que deja continuar en el mismo instante en vez de reiniciar. */
  let tAhora = 0;
  let pausado = false;
  let terminado = false;

  function frame(ts: number, gen: number): void {
    if (gen !== generacion) return;
    // Tope de 80 ms por cuadro: si la pestaña estuvo oculta, `rAF` vuelve con un salto enorme y la
    // escena se saltearía medio acto de golpe.
    const dt = anterior === null ? 0 : Math.min(80, ts - anterior);
    anterior = ts;
    tAhora = Math.min(tAhora + dt * velocidad, T.fin);
    dibujar(tAhora);
    if (tAhora < T.fin) raf = requestAnimationFrame((t) => frame(t, gen));
    else terminar();
  }

  function arrancar(desde: number): void {
    cancelAnimationFrame(raf);
    // Sin movimiento el prólogo no aporta nada y sí molesta: se pasa directo al recorrido. Va
    // ANTES de destapar, porque destapar y terminar en el mismo turno dejaba el velo negro puesto
    // sobre una escena ya terminada, con los tres botones muertos y la app bloqueada.
    if (reducido() || angosto() || terminado) {
      terminar();
      return;
    }
    mostrar();
    dichas = new Set();
    tAhora = desde;
    despausar();
    // El gesto que el navegador exige lo dio quien eligió el clima, así que acá ya se puede abrir.
    // El director también lo abre solo con el primer gesto; pedirlo acá cubre a los navegadores que
    // solo aceptan destrabarlo adentro del click, no en el `pointerdown` que escucha él.
    if (sonido().activo()) sonido().desbloquear();
    anterior = null;
    const gen = ++generacion;
    raf = requestAnimationFrame((ts) => frame(ts, gen));
  }

  /** Hermanos del prólogo: el recorrido que quedó debajo del velo. */
  const detras = (): HTMLElement[] =>
    [...(raiz.parentElement?.children ?? [])].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.contains(raiz),
    );

  /**
   * Destapa el prólogo y apaga lo de atrás. Sin esto una sola pulsación de Space o de flecha abajo
   * scrolleaba el recorrido por debajo y la cinemática desaparecía de pantalla; y el chrome
   * invisible del recorrido (topbar y riel, con opacidad 0 pero clickeables) se comía los clicks
   * del HUD, al punto de tapar el botón para entrar en pantallas de tablet.
   */
  function mostrar(): void {
    raiz.hidden = false;
    detras().forEach((el) => (el.inert = true));
  }

  function ocultar(): void {
    raiz.hidden = true;
    detras().forEach((el) => (el.inert = false));
  }

  function terminar(): void {
    if (terminado) return;
    terminado = true;
    cancelAnimationFrame(raf);
    // Las voces que quedaban agendadas no pueden seguir hablando encima del recorrido.
    sonido().callar();
    // El zumbido se apaga ya; la red se suelta recién cuando se apagó el último pip, para no
    // cortarlo en seco.
    if (red) red.zumbidoGain.gain.value = 0;
    luego(soltarAudio, CIERRE_AUDIO_MS);
    ocultar();
    opts.alTerminar();
  }

  /* ── controles ──────────────────────────────────────────────────────────────────────────────
     Solo dos, y los dos hacen falta: saltar (son minutos, y a la segunda visita es lo primero que
     va a buscar cualquiera) y pausar (una cinemática sin pausa es hostil). El sonido es la
     preferencia global del director, la misma del toggle del intro: silenciar en un lado silencia
     en todos. */

  function despausar(): void {
    pausado = false;
    btnPausa.textContent = 'Pausa';
    btnPausa.setAttribute('aria-pressed', 'false');
  }

  function alternarPausa(): void {
    if (terminado) return;
    if (pausado) {
      despausar();
      anterior = null;
      const gen = ++generacion;
      raf = requestAnimationFrame((ts) => frame(ts, gen));
      return;
    }
    pausado = true;
    btnPausa.textContent = 'Continuar';
    btnPausa.setAttribute('aria-pressed', 'true');
    cancelAnimationFrame(raf);
    // El contexto es de toda la app y no se suspende: se callan las voces agendadas y el zumbido,
    // que es continuo y seguiría sonando sobre la escena quieta. Al reanudar, el primer cuadro lo
    // vuelve a escribir.
    sonido().callar();
    if (red) red.zumbidoGain.gain.value = 0;
  }

  const alTeclado = (e: KeyboardEvent): void => {
    // La barra espaciadora es el gesto de pausa que ya tiene aprendido cualquiera que mire un
    // video. Va en `document`: colgado del contenedor no se disparaba nunca porque el foco jamás
    // está ahí, así que la tecla caía en el scroll del recorrido de atrás.
    if (terminado || raiz.hidden) return;
    // El prólogo es modal, pero el recorrido de atrás escucha las flechas en `window` y el `inert`
    // de los hermanos no alcanza al scroller que los contiene: una flecha abajo lo movía y la
    // cinemática quedaba fuera de vista, sonando. Se consumen acá y el motor respeta lo consumido.
    if (TECLAS_DE_DESPLAZAMIENTO.has(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest('button')) return;
    e.preventDefault();
    alternarPausa();
  };

  /** Rueda y arrastre sobre el prólogo tampoco pueden scrollear el recorrido de atrás. */
  const alDesplazar = (e: Event): void => {
    if (!terminado && !raiz.hidden) e.preventDefault();
  };

  /**
   * Con la pestaña oculta el rAF se frena solo, pero el zumbido y la voz no: seguían sonando sobre
   * una escena congelada. Se pausa como si hubiera tocado el botón, y al volver se reanuda solo si
   * la pausa la puso esto y no la persona.
   */
  let pausaDelSistema = false;
  const alCambiarVisibilidad = (): void => {
    if (terminado || raiz.hidden) return;
    if (document.hidden && !pausado) {
      pausaDelSistema = true;
      alternarPausa();
    } else if (!document.hidden && pausaDelSistema) {
      pausaDelSistema = false;
      if (pausado) alternarPausa();
    }
  };

  const alSaltar = (): void => terminar();
  const alPausar = (): void => alternarPausa();
  const pintarVelocidad = (): void => {
    btnVelocidad.textContent = `Velocidad ×${velocidad}`;
  };

  const alCambiarVelocidad = (): void => {
    velocidad = VELOCIDADES[(VELOCIDADES.indexOf(velocidad) + 1) % VELOCIDADES.length];
    pintarVelocidad();
    // La línea que está sonando se agendó para la ventana a la velocidad vieja: sin cortarla,
    // seguiría hablando cuando en pantalla ya entró la siguiente.
    sonido().callar();
  };

  const pintarPantalla = (): void => {
    const activa = document.fullscreenElement === raiz;
    btnPantalla.textContent = activa ? 'Salir de pantalla completa' : 'Pantalla completa';
    btnPantalla.setAttribute('aria-pressed', String(activa));
  };

  /**
   * El navegador rechaza la promesa si no viene de un gesto o si la política lo prohíbe (iframes sin
   * `allow="fullscreen"`, por ejemplo). Se traga el error a propósito: no poder agrandar no es
   * motivo para romper la reproducción, y el botón queda diciendo la verdad igual.
   */
  const alCambiarPantalla = (): void => {
    if (document.fullscreenElement === raiz) void document.exitFullscreen().catch(() => undefined);
    else void raiz.requestFullscreen().catch(() => undefined);
  };

  const pintarSonido = (): void => {
    const activo = sonido().activo();
    btnSonido.textContent = activo ? 'Sonido: sí' : 'Sonido: no';
    btnSonido.setAttribute('aria-pressed', String(activo));
  };

  /**
   * Cambia la preferencia GLOBAL. Apagado, el director baja su salida a cero y con eso se calla
   * también el zumbido, que cuelga de ella. El botón se repinta por `alCambiar`, igual que si la
   * cambiara el toggle del intro.
   */
  const alCambiarSonido = (): void => {
    // El click es el gesto que el navegador exige: si lo prende, se aprovecha para destrabarlo.
    if (sonido().alternar()) sonido().desbloquear();
  };
  const dejarDeOirSonido = sonido().alCambiar(pintarSonido);

  /** Solo calla a los personajes; la escena sigue sonando y el reloj no cambia. */
  const alCambiarVoces = (): void => {
    voces = !voces;
    pintarVoces();
    if (!voces) sonido().callar();
  };

  skipEl.addEventListener('click', alSaltar);
  btnPausa.addEventListener('click', alPausar);
  btnVoz.addEventListener('click', alCambiarVoces);
  btnSonido.addEventListener('click', alCambiarSonido);
  btnPantalla.addEventListener('click', alCambiarPantalla);
  btnVelocidad.addEventListener('click', alCambiarVelocidad);
  // También cambia por Escape o por F11, que no pasan por el botón.
  document.addEventListener('fullscreenchange', pintarPantalla);
  document.addEventListener('keydown', alTeclado);
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  // Pedir menos movimiento a mitad de la cinemática la termina, igual que si lo pidiera al entrar.
  const mqlReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const alReducirMovimiento = (e: MediaQueryListEvent): void => {
    if (e.matches) terminar();
  };
  mqlReduce.addEventListener('change', alReducirMovimiento);
  raiz.addEventListener('wheel', alDesplazar, { passive: false });
  raiz.addEventListener('touchmove', alDesplazar, { passive: false });

  pintarVoces();
  pintarSonido();
  pintarPantalla();
  pintarVelocidad();
  arrancar(0);

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    // Terminado, ya se calló al terminar: callar de nuevo cortaría lo que suene después, como las
    // voces de las cinemáticas del recorrido.
    if (!terminado) sonido().callar();
    // Si quedaba pendiente soltar la red (el timer recién limpiado), se suelta ya.
    soltarAudio();
    dejarDeOirSonido();
    skipEl.removeEventListener('click', alSaltar);
    btnPausa.removeEventListener('click', alPausar);
    btnVoz.removeEventListener('click', alCambiarVoces);
    btnSonido.removeEventListener('click', alCambiarSonido);
    btnPantalla.removeEventListener('click', alCambiarPantalla);
    btnVelocidad.removeEventListener('click', alCambiarVelocidad);
    document.removeEventListener('fullscreenchange', pintarPantalla);
    // Salir del prólogo no puede dejar la pantalla tomada.
    if (document.fullscreenElement === raiz) void document.exitFullscreen().catch(() => undefined);
    document.removeEventListener('keydown', alTeclado);
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    mqlReduce.removeEventListener('change', alReducirMovimiento);
    raiz.removeEventListener('wheel', alDesplazar);
    raiz.removeEventListener('touchmove', alDesplazar);
  };
}
