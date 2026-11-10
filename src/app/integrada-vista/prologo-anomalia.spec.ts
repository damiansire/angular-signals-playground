import { sonido } from '../libs/sonido';
import { initPrologoAnomalia } from './prologo-anomalia';
import { GUION } from './prologo-guion';
import { cuadrosFalsos, hasta } from './testing/cuadros';

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
 * El prólogo es el paso intermedio entre tocar Entrar y que arranque la construcción de Tusi.
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
        <svg class="prologo__escena"></svg>
        <div class="prologo__mascot"></div>
        <p class="prologo__voz"></p>
        <div class="prologo__dialogo">
          <p class="prologo__globo" data-quien="">
            <span class="prologo__quien"></span><span class="prologo__frase"></span>
          </p>
          <p class="prologo__globo" data-quien="">
            <span class="prologo__quien"></span><span class="prologo__frase"></span>
          </p>
        </div>
        <p class="prologo__titulo"></p>
        <div class="prologo__hud">
          <button class="prologo__pause" type="button"></button>
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
      expect(p.sonido.getAttribute('aria-label')).toBe('Sonido: no');
      sonido().alternar(true);
      expect(p.sonido.getAttribute('aria-label')).toBe('Sonido: sí');
    });

    it('cerrado, deja de escuchar la preferencia', () => {
      const p = arrancar();
      sonido().alternar(true);
      p.cerrar();

      sonido().alternar(false);

      expect(p.sonido.getAttribute('aria-label')).toBe('Sonido: sí');
    });
  });

  describe('voces', () => {
    /** A ×3 la primera línea entra en unos 300 ms en vez de 800. */
    function aTodaVelocidad(p: ReturnType<typeof arrancar>): void {
      p.velocidad.click();
      p.velocidad.click();
      p.velocidad.click();
    }

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

    it('un solo interruptor: apagar el sonido calla también a los personajes', () => {
      sonido().alternar(true);
      const callar = spyOn(sonido(), 'callar');
      const p = arrancar();

      p.sonido.click();

      expect(sonido().activo()).toBeFalse();
      expect(callar).toHaveBeenCalled();
      expect(p.host.querySelector('.prologo__voice')).toBeNull();
    });
  });

  it('dibuja la escena en el SVG: las cuatro naves, cada una tocable', () => {
    const p = arrancar();
    const naves = p.host.querySelectorAll('.prologo__escena [data-nave]');
    expect(naves.length).toBe(4);
  });

  it('tocar una nave no pausa ni termina el prólogo', () => {
    const p = arrancar();
    const nave = p.host.querySelector<SVGGElement>('.prologo__escena [data-nave="0"]')!;
    nave.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }),
    );

    expect(p.veces()).toBe(0);
    expect(p.host.querySelector('.prologo__pause')!.getAttribute('aria-pressed')).toBe('false');
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

  describe('con movimiento reducido', () => {
    /** La preferencia de movimiento, a mano: arranca como diga el test y avisa cuando cambia. */
    function movimiento(reducido: boolean) {
      let avisar: ((e: MediaQueryListEvent) => void) | undefined;
      const real = window.matchMedia.bind(window);
      spyOn(window, 'matchMedia').and.callFake((q: string) =>
        q.includes('reduced-motion')
          ? ({
              matches: reducido,
              media: q,
              addEventListener: (_t: string, fn: (e: MediaQueryListEvent) => void) => (avisar = fn),
              removeEventListener: () => undefined,
            } as unknown as MediaQueryList)
          : real(q),
      );
      return { reducir: () => avisar?.({ matches: true } as MediaQueryListEvent) };
    }

    it('pedirlo a mitad de la cinemática, sin nada que jugar, la termina en el cuadro siguiente', () => {
      const m = movimiento(false);
      const cuadros = cuadrosFalsos();
      const p = arrancar();
      cuadros.avanzar(3);
      expect(p.veces()).withContext('arrancó corriendo').toBe(0);

      m.reducir();
      cuadros.avanzar(2);

      expect(p.veces()).toBe(1);
      expect(p.raiz.hidden).toBeTrue();
    });

    it('sin nada que jugar no se muestra: termina antes de destapar', () => {
      movimiento(true);
      const p = arrancar();
      expect(p.veces()).toBe(1);
      expect(p.raiz.hidden).toBeTrue();
    });

    it('la Introducción se juega igual: quieto, salta a la orden del capitán y espera', async () => {
      movimiento(true);
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      let terminado = 0;
      let resolver: () => void = () => undefined;
      const pedido = jasmine
        .createSpy('operadores')
        .and.callFake(() => new Promise<void>((ok) => (resolver = ok)));
      cerrar.push(
        initPrologoAnomalia(host, {
          alTerminar: () => (terminado += 1),
          operadores: pedido,
        }),
      );
      const frase = (): string =>
        [...host.querySelectorAll('.prologo__frase')].map((f) => f.textContent).join(' | ');

      cuadros.avanzar(2);
      expect(pedido).toHaveBeenCalledTimes(1);
      expect(frase()).toContain('Activen todos los operadores');
      cuadros.avanzar(300);
      expect(terminado).withContext('espera el minijuego').toBe(0);

      resolver();
      await new Promise((ok) => setTimeout(ok));
      cuadros.avanzar(2);
      expect(terminado).toBe(1);
      expect(pedido).toHaveBeenCalledTimes(1);
    });
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

  describe('el minijuego de operadores', () => {
    function conMinijuego(desde: string) {
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      let resolver: () => void = () => undefined;
      const pedido = jasmine
        .createSpy('operadores')
        .and.callFake(() => new Promise<void>((ok) => (resolver = ok)));
      cerrar.push(
        initPrologoAnomalia(host, { alTerminar: () => undefined, desde, operadores: pedido }),
      );
      const frase = (): string =>
        [...host.querySelectorAll('.prologo__frase')].map((f) => f.textContent).join(' | ');
      return { cuadros, pedido, frase, resolver: () => resolver() };
    }

    it('la historia espera en la orden del capitán hasta que se resuelve, y después sigue', async () => {
      const m = conMinijuego('anom-atraidos');
      m.cuadros.avanzar(400);
      expect(m.pedido).toHaveBeenCalledTimes(1);
      expect(m.frase()).toContain('Activen todos los operadores');

      // Quince segundos de escena: la orden sigue ahí, nadie la apura.
      m.cuadros.avanzar(1000);
      expect(m.frase()).toContain('Activen todos los operadores');

      m.resolver();
      await new Promise((ok) => setTimeout(ok));
      m.cuadros.avanzar(1000);
      expect(m.frase()).not.toContain('Activen todos los operadores');
      expect(m.pedido).toHaveBeenCalledTimes(1);
    });

    it('quien arranca después de la orden no pasa por el minijuego', () => {
      const m = conMinijuego('anom-pipes');
      m.cuadros.avanzar(400);
      expect(m.pedido).not.toHaveBeenCalled();
    });
  });

  describe('los puntos para retomar', () => {
    it('avisa cada punto una vez y en orden, y no los que quedaron antes del arranque', () => {
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      const pasados: string[] = [];
      cerrar.push(
        initPrologoAnomalia(host, {
          alTerminar: () => undefined,
          desde: 'anom-lento',
          alPasarPunto: (linea) => pasados.push(linea),
        }),
      );
      for (let i = 0; i < 4000 && pasados.length < 2; i++) cuadros.avanzar(1);

      expect(pasados).toEqual(['anom-manual', 'dentro-vivos']);
    });

    it('sin nadie que escuche, la historia avanza igual por los puntos', () => {
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      cerrar.push(initPrologoAnomalia(host, { alTerminar: () => undefined, desde: 'anom-lento' }));
      cuadros.avanzar(600);

      expect(cuadros.pendientes()).toBe(1);
    });
  });

  describe('el manual de a bordo', () => {
    function conManual(desde: string) {
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      let resolver: () => void = () => undefined;
      const pedido = jasmine
        .createSpy('manual')
        .and.callFake(() => new Promise<void>((ok) => (resolver = ok)));
      cerrar.push(
        initPrologoAnomalia(host, { alTerminar: () => undefined, desde, manual: pedido }),
      );
      const frase = (): string =>
        [...host.querySelectorAll('.prologo__frase')].map((f) => f.textContent).join(' | ');
      return { cuadros, host, pedido, frase, resolver: () => resolver() };
    }

    it('se abre con la orden del capitán ya leída, con sus cinco páginas, y la historia espera', async () => {
      const m = conManual('anom-velocidad');
      m.cuadros.avanzar(400);
      expect(m.pedido).toHaveBeenCalledTimes(1);
      expect((m.pedido.calls.mostRecent().args[0] as readonly unknown[]).length).toBe(5);
      expect(m.frase()).toContain('el manual de a bordo');

      m.cuadros.avanzar(1000);
      expect(m.frase()).not.toContain('leyes del espacio');

      m.resolver();
      await new Promise((ok) => setTimeout(ok));
      // Dos segundos: alcanza para la línea siguiente y no para pasarla.
      m.cuadros.avanzar(120);
      expect(m.frase()).toContain('leyes del espacio');
      expect(m.pedido).toHaveBeenCalledTimes(1);
    });

    it('adentro del manual las teclas son del manual, y el espacio no pausa la historia', () => {
      const m = conManual('anom-velocidad');
      m.cuadros.avanzar(400);
      const raiz = m.host.querySelector<HTMLElement>('.prologo')!;
      const manual = document.createElement('section');
      manual.className = 'prologo__manual';
      manual.tabIndex = -1;
      raiz.append(manual);
      const tecla = (destino: EventTarget, key: string, code = key) => {
        const e = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true });
        destino.dispatchEvent(e);
        return e;
      };

      // Las desplaza la vista, que muestra el manual (`pasoEnElManual`): el motor no las toca.
      expect(tecla(manual, ' ', 'Space').defaultPrevented).toBeFalse();
      expect(tecla(manual, 'ArrowDown').defaultPrevented).toBeFalse();
      expect(tecla(document.body, 'ArrowDown').defaultPrevented).toBeFalse();
      const pausa = m.host.querySelector<HTMLButtonElement>('.prologo__pause')!;
      expect(pausa.getAttribute('aria-pressed')).toBe('false');
      // Afuera del manual siguen frenadas: el recorrido de atrás las escucha.
      expect(tecla(pausa, 'ArrowDown').defaultPrevented).toBeTrue();

      // La rueda scrollea el manual, pero no llega al recorrido de atrás, que la escucha más arriba.
      const atras = jasmine.createSpy('rueda del recorrido');
      m.host.addEventListener('wheel', atras);
      const ruedaAdentro = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      });
      manual.dispatchEvent(ruedaAdentro);
      expect(ruedaAdentro.defaultPrevented).toBeFalse();
      expect(atras).not.toHaveBeenCalled();
      m.host.removeEventListener('wheel', atras);
      const ruedaAfuera = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
      raiz.dispatchEvent(ruedaAfuera);
      expect(ruedaAfuera.defaultPrevented).toBeTrue();
    });

    it('quien arranca después de la orden no pasa por el manual', () => {
      const m = conManual('anom-leyes');
      m.cuadros.avanzar(400);
      expect(m.pedido).not.toHaveBeenCalled();
    });
  });

  describe('el árbol de Signal Space', () => {
    function conArbol(desde: string) {
      const cuadros = cuadrosFalsos();
      const host = hostCompleto();
      hosts.push(host);
      let resolver: () => void = () => undefined;
      const pedido = jasmine
        .createSpy('arbol')
        .and.callFake(() => new Promise<void>((ok) => (resolver = ok)));
      cerrar.push(initPrologoAnomalia(host, { alTerminar: () => undefined, desde, arbol: pedido }));
      const frase = (): string =>
        [...host.querySelectorAll('.prologo__frase')].map((f) => f.textContent).join(' | ');
      return { cuadros, pedido, frase, resolver: () => resolver() };
    }

    it('Angie lo muestra con la pregunta del viaje ya hecha, y la historia espera', async () => {
      const m = conArbol('leccion-pregunta');
      m.cuadros.avanzar(400);
      expect(m.pedido).toHaveBeenCalledTimes(1);
      expect((m.pedido.calls.mostRecent().args[0] as { id: string }).id).toBe(
        'signals-change-detection',
      );
      expect(m.frase()).toContain('Miren el árbol');

      m.cuadros.avanzar(1000);
      expect(m.frase()).not.toContain('Guarden esa pregunta');

      m.resolver();
      await new Promise((ok) => setTimeout(ok));
      m.cuadros.avanzar(120);
      expect(m.frase()).toContain('Guarden esa pregunta');
      expect(m.pedido).toHaveBeenCalledTimes(1);
    });

    it('quien arranca después de mostrarlo no lo vuelve a ver', () => {
      const m = conArbol('leccion-guarden');
      m.cuadros.avanzar(400);
      expect(m.pedido).not.toHaveBeenCalled();
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
