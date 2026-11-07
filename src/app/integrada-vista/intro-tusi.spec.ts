import { sonido } from '../libs/sonido';
import { initIntroTusi } from './intro-tusi';
import { cuadrosFalsos } from './testing/cuadros';

/**
 * La landing es lo primero que ve cualquiera y son 533 líneas que no tenían ningún test.
 * Lo que se cubre acá es su contrato con el resto: que entrar cierre el overlay y ceda el
 * gatillo de la construcción UNA vez, y que un markup incompleto se note en vez de dejar la app
 * trabada detrás de un overlay que ya nadie puede cerrar.
 */
describe('initIntroTusi', () => {
  const cerrar: (() => void)[] = [];
  const hosts: HTMLElement[] = [];
  /** La preferencia de sonido es global y persiste entre tests: cada uno la deja como la encontró. */
  let sonidoAlEntrar = true;

  beforeEach(() => {
    sonidoAlEntrar = sonido().activo();
    // Sin gesto real no hay contexto que abrir, y sin contexto no hay salida: así ningún test
    // depende del hardware de audio.
    spyOn(sonido(), 'desbloquear');
    spyOn(sonido(), 'salida').and.returnValue(null);
  });

  afterEach(() => {
    cerrar.splice(0).forEach((fn) => fn());
    hosts.splice(0).forEach((h) => h.remove());
    if (sonido().activo() !== sonidoAlEntrar) sonido().alternar(sonidoAlEntrar);
  });

  /** Markup mínimo que el intro exige. */
  function hostCompleto(): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = `
      <div class="intro" id="intro">
        <div class="tusi">
          <canvas class="tusi__canvas" width="320" height="240"></canvas>
          <p class="tusi__epigraph"></p>
          <button class="tusi__help" type="button"></button>
          <div class="tusi__counter">
            <span class="tusi__pips">${'<span class="tusi__pip"></span>'.repeat(8)}</span>
            <span class="tusi__counter-n"></span>
          </div>
          <div class="tusi__hud">
            <button data-role="sound" type="button"></button>
            <button data-role="reset" type="button"></button>
            <button data-role="pause" type="button"></button>
            <button data-role="speed" type="button"></button>
            <span class="tusi__speed-val"></span>
            <div class="tusi__menu"></div>
          </div>
          <div class="tusi__overlay">
            <button data-role="ov-sound" type="button"></button>
            <span class="tusi__ov-sound-txt"></span>
            <button data-role="entrar" type="button"></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);
    hosts.push(host);
    return host;
  }

  function arrancar(despedida?: () => Promise<void>) {
    const host = hostCompleto();
    const gatillos: (() => void)[] = [];
    const sonidos: boolean[] = [];
    const handle = initIntroTusi(host, {
      alEntrar: (startBuild, conSonido) => {
        gatillos.push(startBuild);
        sonidos.push(conSonido);
      },
      ...(despedida ? { despedida } : {}),
    });
    cerrar.push(handle.dispose);
    return {
      host,
      handle,
      overlay: host.querySelector<HTMLElement>('.tusi__overlay')!,
      entrar: host.querySelector<HTMLButtonElement>('[data-role="entrar"]')!,
      ovSound: host.querySelector<HTMLButtonElement>('[data-role="ov-sound"]')!,
      ovSoundTxt: host.querySelector<HTMLElement>('.tusi__ov-sound-txt')!,
      hudSound: host.querySelector<HTMLButtonElement>('.tusi__hud [data-role="sound"]')!,
      gatillos,
      sonidos,
    };
  }

  describe('markup incompleto', () => {
    it('avisa qué falta en vez de devolver un no-op silencioso', () => {
      const host = document.createElement('div');
      hosts.push(host);
      expect(() => initIntroTusi(host)).toThrowError(/falta \.tusi/);
    });

    it('también avisa si está el contenedor pero falta el canvas', () => {
      const host = document.createElement('div');
      host.innerHTML = '<div class="tusi"></div>';
      hosts.push(host);
      expect(() => initIntroTusi(host)).toThrowError(/falta \.tusi__canvas/);
    });
  });

  describe('entrar', () => {
    it('arranca con el overlay puesto: hay que tocar Entrar', () => {
      const t = arrancar();
      expect(t.overlay.classList.contains('gone')).toBeFalse();
      expect(t.gatillos.length).toBe(0);
    });

    it('cierra el overlay y lo saca del tab-order', () => {
      const t = arrancar();

      t.entrar.click();

      expect(t.overlay.classList.contains('gone')).toBeTrue();
      // `.gone` solo apaga opacidad y pointer-events: sin inert los botones siguen tabulables.
      expect(t.overlay.inert).toBeTrue();
    });

    it('cede el gatillo de la construcción exactamente una vez', () => {
      const t = arrancar();

      t.entrar.click();

      expect(t.gatillos.length).toBe(1);
      expect(typeof t.gatillos[0]).toBe('function');
    });

    it('entrar de nuevo no vuelve a ceder el gatillo', () => {
      const t = arrancar();

      t.entrar.click();
      t.entrar.click();
      t.entrar.click();

      expect(t.gatillos.length).toBe(1);
    });

    it('el chrome del recorrido sigue inerte durante el prólogo y se libera al construir', () => {
      const t = arrancar();
      // El chrome del recorrido es hermano del `.intro` (topbar y riel van por encima en z-index).
      const topbar = document.createElement('div');
      t.host.appendChild(topbar);
      topbar.inert = true;

      t.entrar.click();
      expect(topbar.inert).withContext('prólogo corriendo: el chrome no se toca').toBeTrue();

      t.gatillos[0]();
      expect(topbar.inert).withContext('construcción arrancada').toBeFalse();
    });
  });

  describe('con despedida', () => {
    it('desbloquea el audio en el click, antes de que termine la salida', () => {
      sonido().alternar(true);
      const t = arrancar(() => new Promise<void>(() => undefined));

      t.entrar.click();

      expect(sonido().desbloquear).toHaveBeenCalled();
    });

    it('el overlay espera a la salida, pero ya no se puede volver a tocar', () => {
      const t = arrancar(() => new Promise<void>(() => undefined));

      t.entrar.click();

      expect(t.overlay.classList.contains('gone')).toBeFalse();
      expect(t.overlay.inert).toBeTrue();
      expect(t.gatillos.length).toBe(0);
    });

    it('al terminar la salida cede el gatillo y cierra el overlay', async () => {
      let terminar: () => void = () => undefined;
      const t = arrancar(() => new Promise<void>((ok) => (terminar = ok)));

      t.entrar.click();
      terminar();
      await Promise.resolve();
      await Promise.resolve();

      expect(t.gatillos.length).toBe(1);
      expect(t.overlay.classList.contains('gone')).toBeTrue();
    });

    it('si se desmonta en el medio, la salida que termina después no arranca nada', async () => {
      let terminar: () => void = () => undefined;
      const t = arrancar(() => new Promise<void>((ok) => (terminar = ok)));

      t.entrar.click();
      t.handle.dispose();
      terminar();
      await Promise.resolve();
      await Promise.resolve();

      expect(t.gatillos.length).toBe(0);
    });
  });

  it('sin alEntrar la construcción arranca sola, sin quedar esperando a nadie', () => {
    const host = hostCompleto();
    cerrar.push(initIntroTusi(host).dispose);

    const overlay = host.querySelector<HTMLElement>('.tusi__overlay')!;
    host.querySelector<HTMLButtonElement>('[data-role="entrar"]')!.click();

    expect(overlay.classList.contains('gone')).toBeTrue();
  });

  it('cerrar es idempotente y no tira', () => {
    const host = hostCompleto();
    const { dispose } = initIntroTusi(host);

    expect(() => {
      dispose();
      dispose();
    }).not.toThrow();
  });

  describe('la preferencia de sonido es una sola para toda la app', () => {
    // La elige el overlay del intro pero después suenan el prólogo y el recorrido: silenciar antes
    // de entrar tiene que valer para todo, no solo para la intro.
    it('con el sonido puesto, avisa que va con sonido', () => {
      sonido().alternar(true);
      const t = arrancar();
      t.entrar.click();
      expect(t.sonidos).toEqual([true]);
    });

    it('si silenciaste en el overlay, queda silenciado para todos y el aviso lo dice', () => {
      sonido().alternar(true);
      const t = arrancar();
      t.ovSound.click();
      t.entrar.click();
      expect(sonido().activo()).toBeFalse();
      expect(t.sonidos).toEqual([false]);
    });

    it('arranca mostrando la preferencia guardada, aunque venga apagada de otra visita', () => {
      sonido().alternar(false);
      const t = arrancar();
      expect(t.hudSound.textContent).toBe('🔇');
      expect(t.ovSound.getAttribute('aria-pressed')).toBe('false');
    });

    it('los dos toggles muestran lo mismo, venga de donde venga el cambio', () => {
      sonido().alternar(true);
      const t = arrancar();

      t.hudSound.click();
      expect(t.ovSoundTxt.textContent).toBe('Sonido silenciado · tocá para activar');
      expect(t.hudSound.getAttribute('aria-label')).toBe('Activar sonido');

      // Como si lo hubiera prendido el botón del prólogo.
      sonido().alternar(true);
      expect(t.hudSound.textContent).toBe('🔊');
      expect(t.ovSound.getAttribute('aria-pressed')).toBe('true');
    });

    it('cerrada, deja de escuchar la preferencia', () => {
      sonido().alternar(true);
      const t = arrancar();
      t.handle.dispose();

      sonido().alternar(false);

      expect(t.hudSound.textContent).toBe('🔊');
    });
  });

  describe('el loop duerme cuando no hay nada que mover', () => {
    /**
     * Los cuadros los da el test, no el navegador. Contar `requestAnimationFrame` en ventanas de
     * reloj real medía también la carga de la máquina: con la CPU tomada entraban dos cuadros en
     * 150 ms. Y el espía era global: los cuadros de más que llegó a contar fuera de vista no son de
     * la intro, que corta el loop antes de pedir otro, sino de otro código de la página de Karma
     * que corría durante las esperas. Con el rAF falso el test es síncrono: entre `arrancar` y el
     * último `expect` no corre nada ajeno ni pasa tiempo real.
     */
    it('antes de entrar dibuja y deja de pedir cuadros', () => {
      const cuadros = cuadrosFalsos();
      const t = arrancar();
      expect(cuadros.pendientes()).withContext('el primer cuadro, que mide y dibuja').toBe(1);

      cuadros.avanzar(10);

      expect(t.host.querySelector('.tusi__epigraph')!.textContent)
        .withContext('dibujó')
        .not.toBe('');
      expect(cuadros.pendientes()).withContext('sin nada que mover').toBe(0);
    });

    it('con la construcción andando sí pide cuadros, y fuera de vista vuelve a dormir', () => {
      const cuadros = cuadrosFalsos();
      const t = arrancar();
      t.entrar.click();
      t.gatillos[0]();

      cuadros.avanzar(10);
      expect(cuadros.pendientes())
        .withContext('construyendo: cada cuadro pide el siguiente')
        .toBe(1);

      t.handle.setVisible(false);
      // El cuadro que ya estaba pedido corre igual: tiene que notar que no se ve y no pedir otro.
      cuadros.avanzar(10);
      expect(cuadros.pendientes()).withContext('fuera de vista').toBe(0);

      t.handle.setVisible(true);
      expect(cuadros.pendientes()).withContext('de vuelta a la vista retoma').toBe(1);
    });
  });

  describe('visibilidad avisada por el motor', () => {
    // Antes se sondeaba `introEl.style.opacity` cuadro a cuadro: un módulo leyendo el detalle de
    // implementación del fade de otro.
    it('salir de vista saca el intro del tab-order', () => {
      const t = arrancar();
      const intro = t.host.querySelector<HTMLElement>('.intro')!;

      t.handle.setVisible(false);

      expect(intro.inert).toBeTrue();
    });

    it('volver a la vista lo devuelve al tab-order', () => {
      const t = arrancar();
      const intro = t.host.querySelector<HTMLElement>('.intro')!;

      t.handle.setVisible(false);
      t.handle.setVisible(true);

      expect(intro.inert).toBeFalse();
    });

    it('sin entrar (deep-link), salir de vista libera el chrome del recorrido', () => {
      const t = arrancar();
      const topbar = document.createElement('div');
      t.host.appendChild(topbar);
      topbar.inert = true;

      t.handle.setVisible(false);
      expect(topbar.inert).withContext('landing fuera de vista').toBeFalse();

      t.handle.setVisible(true);
      expect(topbar.inert).withContext('el overlay vuelve a tapar').toBeTrue();
    });

    it('avisar dos veces lo mismo no hace nada', () => {
      const t = arrancar();
      const intro = t.host.querySelector<HTMLElement>('.intro')!;

      t.handle.setVisible(false);
      t.handle.setVisible(false);

      expect(intro.inert).toBeTrue();
    });
  });
});
