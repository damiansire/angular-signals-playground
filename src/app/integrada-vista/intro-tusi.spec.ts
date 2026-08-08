import { initIntroTusi } from './intro-tusi';

/**
 * La landing es lo primero que ve cualquiera y son 533 líneas que no tenían ningún test.
 * Lo que se cubre acá es su contrato con el resto: que elegir el clima cierre el overlay y ceda el
 * gatillo de la construcción UNA vez, y que un markup incompleto se note en vez de dejar la app
 * trabada detrás de un overlay que ya nadie puede cerrar.
 */
describe('initIntroTusi', () => {
  const cerrar: (() => void)[] = [];
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    cerrar.splice(0).forEach((fn) => fn());
    hosts.splice(0).forEach((h) => h.remove());
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
          <div class="tusi__counter"><span class="tusi__counter-n"></span></div>
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
            <button data-role="pick-dark" type="button"></button>
            <button data-role="pick-light" type="button"></button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);
    hosts.push(host);
    return host;
  }

  function arrancar() {
    const host = hostCompleto();
    const gatillos: (() => void)[] = [];
    const sonidos: boolean[] = [];
    const handle = initIntroTusi(host, {
      onThemePicked: (startBuild, conSonido) => {
        gatillos.push(startBuild);
        sonidos.push(conSonido);
      },
    });
    cerrar.push(handle.dispose);
    return {
      host,
      handle,
      overlay: host.querySelector<HTMLElement>('.tusi__overlay')!,
      dark: host.querySelector<HTMLButtonElement>('[data-role="pick-dark"]')!,
      light: host.querySelector<HTMLButtonElement>('[data-role="pick-light"]')!,
      ovSound: host.querySelector<HTMLButtonElement>('[data-role="ov-sound"]')!,
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

  describe('elegir el clima', () => {
    it('arranca con el overlay puesto: hay que elegir para entrar', () => {
      const t = arrancar();
      expect(t.overlay.classList.contains('gone')).toBeFalse();
      expect(t.gatillos.length).toBe(0);
    });

    it('cierra el overlay y lo saca del tab-order', () => {
      const t = arrancar();

      t.dark.click();

      expect(t.overlay.classList.contains('gone')).toBeTrue();
      // `.gone` solo apaga opacidad y pointer-events: sin inert los botones siguen tabulables.
      expect(t.overlay.inert).toBeTrue();
    });

    it('cede el gatillo de la construcción exactamente una vez', () => {
      const t = arrancar();

      t.dark.click();

      expect(t.gatillos.length).toBe(1);
      expect(typeof t.gatillos[0]).toBe('function');
    });

    it('elegir de nuevo no vuelve a ceder el gatillo', () => {
      const t = arrancar();

      t.dark.click();
      t.light.click();
      t.dark.click();

      expect(t.gatillos.length).toBe(1);
    });

    it('cualquiera de los dos climas entra igual', () => {
      const t = arrancar();

      t.light.click();

      expect(t.overlay.classList.contains('gone')).toBeTrue();
      expect(t.gatillos.length).toBe(1);
    });
  });

  it('sin onThemePicked la construcción arranca sola, sin quedar esperando a nadie', () => {
    const host = hostCompleto();
    cerrar.push(initIntroTusi(host).dispose);

    const overlay = host.querySelector<HTMLElement>('.tusi__overlay')!;
    host.querySelector<HTMLButtonElement>('[data-role="pick-light"]')!.click();

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

  describe('la preferencia de sonido cruza el boundary', () => {
    // La elige el overlay del intro pero quien suena después es el prólogo: sin pasarla, alguien
    // que silenciaba antes de entrar escuchaba igual la cinemática entera.
    it('con el sonido puesto, avisa que va con sonido', () => {
      const t = arrancar();
      t.dark.click();
      expect(t.sonidos).toEqual([true]);
    });

    it('si silenciaste en el overlay, el aviso viaja en silencio', () => {
      const t = arrancar();
      t.ovSound.click();
      t.dark.click();
      expect(t.sonidos).toEqual([false]);
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

    it('avisar dos veces lo mismo no hace nada', () => {
      const t = arrancar();
      const intro = t.host.querySelector<HTMLElement>('.intro')!;

      t.handle.setVisible(false);
      t.handle.setVisible(false);

      expect(intro.inert).toBeTrue();
    });
  });
});
