import { sonido } from '../libs/sonido';
import { initPrologoAnomalia } from './prologo-anomalia';
import { GUION } from './prologo-guion';
import { hasta } from './testing/cuadros';

/** Un nodo de audio que acepta todo lo que el prólogo le hace y anota lo que importa. */
function nodoFalso(contexto: unknown) {
  const parametro = () => ({
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  });
  return {
    context: contexto,
    type: '',
    gain: parametro(),
    frequency: parametro(),
    conectadoA: [] as unknown[],
    connect(destino: unknown) {
      this.conectadoA.push(destino);
      return destino;
    },
    disconnect: jasmine.createSpy('disconnect'),
    start: jasmine.createSpy('start'),
    stop: jasmine.createSpy('stop'),
  };
}

/** Lo justo de un AudioContext compartido para ver qué arma el prólogo encima y qué suelta. */
class ContextoFalso {
  currentTime = 0;
  sampleRate = 44100;
  osciladores: ReturnType<typeof nodoFalso>[] = [];
  ganancias: ReturnType<typeof nodoFalso>[] = [];
  close = jasmine.createSpy('close');
  createGain() {
    const n = nodoFalso(this);
    this.ganancias.push(n);
    return n;
  }
  createOscillator() {
    const n = nodoFalso(this);
    this.osciladores.push(n);
    return n;
  }
  createBiquadFilter() {
    return nodoFalso(this);
  }
}

/**
 * El prólogo es el paso intermedio entre elegir el clima y que arranque la construcción de Tusi.
 * `alTerminar` es lo único que destraba la landing, así que todo camino de salida tiene que
 * llamarlo, y exactamente una vez.
 *
 * Antes acá solo estaba cubierto el camino DEGRADADO (el prólogo que no puede ni arrancar). Que
 * alguna vez TERMINE y ceda la posta no lo verificaba nadie, en 1.400 líneas de cinemática.
 */
describe('initPrologoAnomalia', () => {
  /** Markup mínimo que el prólogo exige para inicializar. Si falta uno solo, degrada. */
  function hostCompleto(): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = `
      <div class="prologo">
        <div class="prologo__stage">
          <canvas class="prologo__canvas" width="640" height="360"></canvas>
          <p class="prologo__quien"></p>
          <div class="prologo__mascot"></div>
        </div>
        <div class="prologo__hud">
          <button class="prologo__pause" type="button"></button>
          <button class="prologo__voice" type="button"></button>
          <button class="prologo__sound" type="button"></button>
          <button class="prologo__speed" type="button"></button>
          <button class="prologo__full" type="button"></button>
          <button class="prologo__skip" type="button"></button>
        </div>
      </div>`;
    document.body.appendChild(host);
    return host;
  }

  const cerrar: (() => void)[] = [];
  const hosts: HTMLElement[] = [];
  /** La preferencia de sonido es global y persiste entre tests: cada uno la deja como la encontró. */
  let sonidoAlEntrar = true;
  let salida: jasmine.Spy;

  beforeEach(() => {
    sonidoAlEntrar = sonido().activo();
    // Sin gesto real no hay contexto que abrir, y sin contexto no hay salida: así ningún test
    // depende del hardware de audio. El que necesita una salida le pasa una falsa.
    spyOn(sonido(), 'desbloquear');
    salida = spyOn(sonido(), 'salida').and.returnValue(null);
  });

  afterEach(() => {
    cerrar.splice(0).forEach((fn) => fn());
    hosts.splice(0).forEach((h) => h.remove());
    if (sonido().activo() !== sonidoAlEntrar) sonido().alternar(sonidoAlEntrar);
  });

  function arrancar() {
    const host = hostCompleto();
    hosts.push(host);
    let terminado = 0;
    const dispose = initPrologoAnomalia(host, { alTerminar: () => (terminado += 1) });
    cerrar.push(dispose);
    return {
      host,
      skip: host.querySelector<HTMLButtonElement>('.prologo__skip')!,
      raiz: host.querySelector<HTMLElement>('.prologo')!,
      voces: host.querySelector<HTMLButtonElement>('.prologo__voice')!,
      sonido: host.querySelector<HTMLButtonElement>('.prologo__sound')!,
      velocidad: host.querySelector<HTMLButtonElement>('.prologo__speed')!,
      veces: () => terminado,
      cerrar: dispose,
    };
  }

  describe('sonido', () => {
    it('sin audio disponible corre igual, mudo, y termina sin tirar', () => {
      const p = arrancar();

      expect(p.raiz.hidden).toBeFalse();
      expect(() => p.skip.click()).not.toThrow();
      expect(p.veces()).toBe(1);
    });

    it('sintetiza sobre la salida común y nunca cierra el contexto compartido', async () => {
      const ctx = new ContextoFalso();
      const comun = nodoFalso(ctx);
      salida.and.returnValue({
        ctx: ctx as unknown as AudioContext,
        salida: comun as unknown as AudioNode,
      });
      const p = arrancar();
      await hasta(() => ctx.osciladores.length > 0);

      const [zumbido] = ctx.osciladores;
      expect(zumbido).withContext('armó el zumbido').toBeDefined();
      expect(ctx.ganancias.some((g) => g.conectadoA.includes(comun)))
        .withContext('cuelga de la salida del director')
        .toBeTrue();

      p.skip.click();
      expect(ctx.close).withContext('al saltar').not.toHaveBeenCalled();

      p.cerrar();
      expect(zumbido.stop).toHaveBeenCalled();
      expect(zumbido.disconnect).toHaveBeenCalled();
      expect(ctx.close).withContext('al cerrar').not.toHaveBeenCalled();
    });

    it('el botón de sonido cambia la preferencia GLOBAL y se repinta si cambia desde otro lado', () => {
      const p = arrancar();
      const antes = sonido().activo();

      p.sonido.click();
      expect(sonido().activo()).toBe(!antes);
      expect(p.sonido.getAttribute('aria-pressed')).toBe(String(!antes));

      // Como si lo hubiera silenciado el toggle del intro.
      sonido().alternar(false);
      expect(p.sonido.textContent).toBe('Sonido: no');
      sonido().alternar(true);
      expect(p.sonido.textContent).toBe('Sonido: sí');
    });

    it('cerrado, deja de escuchar la preferencia', () => {
      const p = arrancar();
      sonido().alternar(true);
      p.cerrar();

      sonido().alternar(false);

      expect(p.sonido.textContent).toBe('Sonido: sí');
    });
  });

  describe('voces', () => {
    /** A ×3 la primera línea entra en unos 300 ms en vez de 800. */
    function aTodaVelocidad(p: ReturnType<typeof arrancar>): void {
      p.velocidad.click();
      p.velocidad.click();
      p.velocidad.click();
    }

    it('arrancan prendidas y el botón habla de voces, no de si el sistema tiene una', () => {
      const p = arrancar();
      expect(p.voces.textContent).toBe('Voces: sí');
      expect(p.voces.getAttribute('aria-pressed')).toBe('true');
      expect(p.voces.disabled).toBeFalse();
    });

    it('cada línea habla con la voz de su personaje, en la ventana que dura en pantalla', async () => {
      const habla = spyOn(sonido(), 'hablar');
      const p = arrancar();
      aTodaVelocidad(p);

      await hasta(() => habla.calls.count() > 0);

      const [quien, texto, ventana] = habla.calls.first().args;
      expect(quien).toBe(GUION[0].quien);
      expect(texto).toBe(GUION[0].txt);
      expect(ventana).toBeGreaterThan(0);
    });

    it('apagarlas calla a los personajes pero no toca la preferencia global', async () => {
      const habla = spyOn(sonido(), 'hablar');
      const antes = sonido().activo();
      const p = arrancar();

      p.voces.click();
      aTodaVelocidad(p);
      await new Promise((r) => setTimeout(r, 900));

      expect(p.voces.textContent).toBe('Voces: no');
      expect(p.voces.getAttribute('aria-pressed')).toBe('false');
      expect(habla).not.toHaveBeenCalled();
      expect(sonido().activo()).toBe(antes);
    });
  });

  it('con su markup completo NO cede la posta de entrada: el prólogo corre', () => {
    const p = arrancar();
    expect(p.veces()).toBe(0);
    expect(p.raiz.hidden).toBeFalse();
  });

  describe('es modal: el recorrido de atrás no se mueve mientras corre', () => {
    const tecla = (key: string): KeyboardEvent => {
      const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e;
    };

    it('consume las teclas de desplazamiento, que el motor ignora ya consumidas', () => {
      arrancar();

      for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']) {
        expect(tecla(key).defaultPrevented).withContext(key).toBeTrue();
      }
    });

    it('consume la rueda sobre la cinemática', () => {
      const p = arrancar();
      const rueda = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });

      p.raiz.dispatchEvent(rueda);

      expect(rueda.defaultPrevented).toBeTrue();
    });

    it('al saltar devuelve las teclas y la rueda', () => {
      const p = arrancar();
      p.skip.click();
      const rueda = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
      p.raiz.dispatchEvent(rueda);

      expect(tecla('ArrowDown').defaultPrevented).toBeFalse();
      expect(rueda.defaultPrevented).toBeFalse();
    });
  });

  it('pedir menos movimiento a mitad de la cinemática la termina', () => {
    let avisar: ((e: MediaQueryListEvent) => void) | undefined;
    const real = window.matchMedia.bind(window);
    spyOn(window, 'matchMedia').and.callFake((q: string) =>
      q.includes('reduced-motion')
        ? ({
            matches: false,
            media: q,
            addEventListener: (_t: string, fn: (e: MediaQueryListEvent) => void) => (avisar = fn),
            removeEventListener: () => undefined,
          } as unknown as MediaQueryList)
        : real(q),
    );
    const p = arrancar();
    expect(p.veces()).withContext('arrancó corriendo').toBe(0);

    avisar?.({ matches: true } as MediaQueryListEvent);

    expect(p.veces()).toBe(1);
    expect(p.raiz.hidden).toBeTrue();
  });

  describe('pestaña oculta', () => {
    function ocultarPestaña(oculta: boolean, spy: jasmine.Spy): void {
      spy.and.returnValue(oculta);
      document.dispatchEvent(new Event('visibilitychange'));
    }

    it('se pausa al ocultarse y se reanuda al volver', () => {
      const p = arrancar();
      const pausa = p.host.querySelector<HTMLButtonElement>('.prologo__pause')!;
      const oculta = spyOnProperty(document, 'hidden', 'get');

      ocultarPestaña(true, oculta);
      expect(pausa.getAttribute('aria-pressed')).withContext('oculta').toBe('true');

      ocultarPestaña(false, oculta);
      expect(pausa.getAttribute('aria-pressed')).withContext('de vuelta').toBe('false');
    });

    it('si la pausa la puso la persona, volver a la pestaña no la saca', () => {
      const p = arrancar();
      const pausa = p.host.querySelector<HTMLButtonElement>('.prologo__pause')!;
      const oculta = spyOnProperty(document, 'hidden', 'get');

      pausa.click();
      ocultarPestaña(true, oculta);
      ocultarPestaña(false, oculta);

      expect(pausa.getAttribute('aria-pressed')).toBe('true');
    });
  });

  it('dice quién habla, y la voz misteriosa no se nombra', async () => {
    const host = hostCompleto();
    const cerrar = initPrologoAnomalia(host, { alTerminar: () => undefined });
    const rotulo = host.querySelector<HTMLElement>('.prologo__quien')!;
    // La primera línea del guion la dice el capitán.
    await hasta(() => rotulo.textContent !== '');
    expect(rotulo.textContent).toBe('Capitán');
    expect(rotulo.classList).toContain('prologo__quien--visible');
    cerrar();
  });

  it('saltar cede la posta exactamente una vez y oculta el prólogo', () => {
    const p = arrancar();

    p.skip.click();

    expect(p.veces()).toBe(1);
    expect(p.raiz.hidden).toBeTrue();
  });

  it('saltar dos veces sigue cediendo la posta una sola vez', () => {
    const p = arrancar();

    p.skip.click();
    p.skip.click();
    p.skip.click();

    expect(p.veces()).toBe(1);
  });

  it('cerrar después de haber salteado no vuelve a llamar ni tira', () => {
    const p = arrancar();
    p.skip.click();

    expect(() => cerrar.splice(0).forEach((fn) => fn())).not.toThrow();
    expect(p.veces()).toBe(1);
  });

  it('cerrar sin haber salteado tampoco tira', () => {
    arrancar();
    expect(() => cerrar.splice(0).forEach((fn) => fn())).not.toThrow();
  });

  it('cede la posta aunque no encuentre su markup: la landing no puede quedar trabada', () => {
    const host = document.createElement('div');
    let terminado = 0;

    const dispose = initPrologoAnomalia(host, { alTerminar: () => (terminado += 1) });

    expect(terminado).toBe(1);
    expect(typeof dispose).toBe('function');
    expect(() => dispose()).not.toThrow();
  });
});
