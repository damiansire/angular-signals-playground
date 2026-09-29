import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { IntegradaVistaComponent } from './integrada-vista.component';
import { signalsRoutesTree } from '../app.routes';
import { cuadrosFalsos, hasta } from './testing/cuadros';

/**
 * La vista de la ruta `/` es el producto entero, y su boot son ~3.900 líneas imperativas que
 * ningún test tocaba: los gates verificaban que el proyecto COMPILA, no que la app ARRANQUE, y el
 * deploy publica en cuanto cierran en verde. Estos tests cubren el arranque real y, sobre todo, el
 * contrato de teardown, que es lo que el módulo promete por escrito y nadie ejercitaba.
 */
describe('IntegradaVistaComponent', () => {
  /** El motor arranca en `afterNextRender`, que corre después del primer ciclo de detección. */
  async function montar() {
    const fixture = TestBed.createComponent(IntegradaVistaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  /**
   * El motor termina de arrancar en un timer de 30 ms: alto del track, posición de apertura y
   * pausa guardada. Se espera a que pase, no un tiempo fijo que con la CPU tomada no alcanza.
   */
  const hastaElArranque = (host: HTMLElement): Promise<void> =>
    hasta(() => host.querySelector<HTMLElement>('#track')!.style.height !== '');

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [IntegradaVistaComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }),
  );

  it('arranca sin tirar y deja el escenario en pie', async () => {
    const fixture = await montar();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('#stage')).withContext('#stage').toBeTruthy();
    expect(host.querySelector('#railTicks')).withContext('#railTicks').toBeTruthy();
    expect(host.querySelector('.topbar')).withContext('.topbar').toBeTruthy();

    fixture.destroy();
  });

  it('el motor dibuja una card por concepto del árbol', async () => {
    const fixture = await montar();

    // Si el motor descartara conceptos en silencio, acá se vería como cards de menos.
    expect(fixture.nativeElement.querySelectorAll('.card--sub').length).toBe(
      signalsRoutesTree.length,
    );

    fixture.destroy();
  });

  describe('pausa de la vida de fondo (WCAG 2.2.2)', () => {
    const CLAVE = 'signals-pausa';
    const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let estilo: HTMLStyleElement;

    beforeEach(() => {
      localStorage.removeItem(CLAVE);
      estilo = document.createElement('style');
      estilo.textContent =
        '@keyframes prueba-loop { to { transform: rotate(1turn); } }' +
        '@keyframes prueba-entrada { from { opacity: 0; } }';
      document.head.appendChild(estilo);
    });
    afterEach(() => {
      localStorage.removeItem(CLAVE);
      estilo.remove();
    });

    /** Un elemento con una animación CSS, colgado dentro del recorrido. */
    function animado(padre: Element, animacion: string): Animation {
      const el = document.createElement('div');
      el.style.animation = animacion;
      padre.appendChild(el);
      return el.getAnimations()[0];
    }

    it('detiene los loops, termina las entradas y no toca lo que el jugador abrió encima', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const btn = host.querySelector<HTMLButtonElement>('.tb-links .tb-pausa')!;
      const loop = animado(host, 'prueba-loop 1s linear infinite');
      // Una entrada que arranca invisible: congelada en su primer cuadro no se vería nunca.
      const entrada = animado(host, 'prueba-entrada 10s both');
      const bitacora = host.appendChild(document.createElement('app-bitacora'));
      const encima = animado(bitacora, 'prueba-entrada 10s both');

      expect(btn.textContent).toBe('Pausar animaciones');
      btn.click();
      expect(btn.textContent)
        .withContext('la etiqueta dice lo que hace')
        .toBe('Reanudar animaciones');
      expect(host.classList).toContain('fondo-en-pausa');
      const quieto = loop.currentTime;
      await esperar(120);
      expect(loop.currentTime).withContext('loop').toBe(quieto);
      expect(entrada.playState).withContext('entrada').toBe('finished');
      expect(encima.playState).withContext('bitácora').toBe('running');

      btn.click();
      expect(host.classList).not.toContain('fondo-en-pausa');
      expect(loop.playbackRate).withContext('loop reanudado').toBe(1);
      fixture.destroy();
    });

    it('en la landing, con el topbar invisible, sus controles no se pueden enfocar', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      await esperar(60); // primer render del motor

      expect(host.querySelector<HTMLElement>('.tb-links')!.inert).toBeTrue();
      fixture.destroy();
    });

    it('reanudar no revive un loop que el CSS canceló mientras duraba la pausa', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const btn = host.querySelector<HTMLButtonElement>('.tb-pausa')!;
      const loop = animado(host, 'prueba-loop 1s linear infinite');

      btn.click();
      // Como el halo de una parada que deja de ser la actual: el CSS le saca la animación.
      (loop.effect as KeyframeEffect).target!.setAttribute('style', 'animation: none');
      expect(loop.playState).toBe('idle');
      btn.click();
      expect(loop.playState).withContext('sigue cancelado').toBe('idle');
      fixture.destroy();
    });

    it('después de una pausa, la pestaña oculta sigue congelando por CSS', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const btn = host.querySelector<HTMLButtonElement>('.tb-pausa')!;
      const loop = animado(host, 'prueba-loop 1s linear infinite');

      btn.click();
      btn.click();
      host.classList.add('anims-frozen'); // lo que pone el motor con `document.hidden`
      expect(loop.playState).toBe('paused');
      host.classList.remove('anims-frozen');
      fixture.destroy();
    });

    it('lo que arranca con la pausa puesta ya nace quieto', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      // Antes del primer render: después, en la landing, los links quedan inertes y el click no llega.
      host.querySelector<HTMLButtonElement>('.tb-pausa')!.click();
      await esperar(60); // pasado el barrido del boot: la entrada solo la atrapa `animationstart`

      const entrada = animado(host, 'prueba-entrada 10s both');
      await esperar(120); // `animationstart` llega en el cuadro siguiente
      expect(entrada.playState).toBe('finished');
      fixture.destroy();
    });

    it('se recuerda entre visitas', async () => {
      localStorage.setItem(CLAVE, '1');
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const loop = animado(host, 'prueba-loop 1s linear infinite');
      await esperar(120); // el boot aplica la pausa a los 30 ms

      expect(host.querySelector('.tb-pausa')!.textContent).toBe('Reanudar animaciones');
      expect(loop.playbackRate).toBe(0);
      fixture.destroy();
    });
  });

  describe('navegación por teclado', () => {
    const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const flecha = (prevenida: boolean): void => {
      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      if (prevenida) e.preventDefault();
      window.dispatchEvent(e);
    };

    it('una flecha ya consumida (un overlay modal) no mueve el recorrido; una libre sí', async () => {
      const fixture = await montar();
      const stage = fixture.nativeElement.querySelector('#stage') as HTMLElement;
      await hastaElArranque(fixture.nativeElement);
      const antes = stage.scrollTop;

      flecha(true);
      await esperar(700); // más que el glide más largo (620 ms): que no pase nada lleva tiempo
      expect(stage.scrollTop).withContext('flecha consumida').toBe(antes);

      flecha(false);
      await hasta(() => stage.scrollTop > antes);
      expect(stage.scrollTop).withContext('flecha libre').toBeGreaterThan(antes);

      fixture.destroy();
    });

    it('un `load` tardío no tira de vuelta al arranque a quien ya navegó', async () => {
      const fixture = await montar();
      const stage = fixture.nativeElement.querySelector('#stage') as HTMLElement;
      await hastaElArranque(fixture.nativeElement);
      const antes = stage.scrollTop;
      flecha(false);
      await hasta(() => stage.scrollTop > antes);
      const navegado = stage.scrollTop;
      expect(navegado).withContext('la flecha movió el recorrido').toBeGreaterThan(antes);

      window.dispatchEvent(new Event('load'));

      expect(stage.scrollTop).toBe(navegado);
      fixture.destroy();
    });
  });

  describe('mountSub', () => {
    it('monta el componente REAL del sub-nivel dentro de la .subhost, y renderiza algo', async () => {
      const fixture = await montar();
      const subhost = fixture.nativeElement.querySelector('.subhost') as HTMLElement;

      expect(subhost).toBeTruthy();
      expect(subhost.childElementCount)
        .withContext('la card se montó vacía: mountSub degrada sin ruido')
        .toBeGreaterThan(0);
      expect(subhost.textContent?.trim().length)
        .withContext('el componente montó pero no pintó nada')
        .toBeGreaterThan(0);

      fixture.destroy();
    });

    it('al destruir se lleva el componente montado pero NO la .subhost que lo aloja', async () => {
      const fixture = await montar();
      const subhost = fixture.nativeElement.querySelector('.subhost') as HTMLElement;
      const montado = subhost.firstElementChild;

      expect(montado).toBeTruthy();

      fixture.destroy();

      // El disposer usa un nodo propio justamente para no borrar la .subhost persistente.
      expect(subhost.contains(montado)).toBeFalse();
    });
  });

  describe('red de contención del boot', () => {
    it('con el arranque sano no muestra ningún cartel de error', async () => {
      const fixture = await montar();

      expect(fixture.componentInstance.bootFallo()).toBeFalse();
      expect(fixture.nativeElement.querySelector('.boot-fallo')).toBeNull();

      fixture.destroy();
    });

    it('si el boot falla, la pantalla lo dice en vez de quedarse muerta', async () => {
      const fixture = await montar();

      fixture.componentInstance.bootFallo.set(true);
      fixture.detectChanges();

      const cartel = fixture.nativeElement.querySelector('.boot-fallo') as HTMLElement;
      expect(cartel).withContext('no hay fallback declarativo').toBeTruthy();
      expect(cartel.getAttribute('role')).toBe('alert');
      expect(cartel.textContent).toContain('no pudo arrancar');
      expect(cartel.querySelector('button')).withContext('sin salida para el usuario').toBeTruthy();

      fixture.destroy();
    });
  });

  describe('contrato de teardown', () => {
    it('después de destruir no queda ningún rAF pidiendo cuadros', async () => {
      // Los cuadros los da el test y se mira lo que queda pedido. Antes se contaban pedidos durante
      // 250 ms de reloj real: se le anotaban al motor los de cualquier otro código de la página de
      // Karma, y un cuadro que el cierre olvidaba cancelar no se veía, porque no pide otro.
      const cuadros = cuadrosFalsos();
      const fixture = await montar();
      expect(cuadros.pendientes())
        .withContext('el motor arranca con cuadros pedidos: sin eso no hay nada que cortar')
        .toBeGreaterThan(0);

      fixture.destroy();
      // Destruir le avisa al scheduler zoneless de Angular, que pide un cuadro y lo cancela en su
      // propio setTimeout(0), agendado antes que este: al volver, lo pendiente es solo del motor.
      await new Promise((r) => setTimeout(r));

      expect(cuadros.pendientes())
        .withContext('el motor sigue animando sobre una vista que ya no existe')
        .toBe(0);
    });

    it('devuelve todos los listeners globales que tomó', async () => {
      // Solo los que toma el motor. `popstate`/`hashchange` son del Router de Angular, que vive
      // más allá de esta vista y los suelta con el entorno de test, no con `fixture.destroy()`:
      // incluirlos haría fallar el test por algo que no es responsabilidad de este módulo.
      const DEL_MOTOR = ['keydown', 'resize', 'load', 'visibilitychange', 'wheel', 'touchmove'];
      const objetivos = [window, document] as const;
      const tomados = new Map<string, number>();
      const originales = objetivos.map((o) => [o.addEventListener, o.removeEventListener] as const);

      const clave = (o: unknown, tipo: string) => `${o === window ? 'window' : 'document'}:${tipo}`;

      objetivos.forEach((o, i) => {
        const [add, remove] = originales[i];
        o.addEventListener = function (tipo: string, ...resto: unknown[]) {
          tomados.set(clave(o, tipo), (tomados.get(clave(o, tipo)) ?? 0) + 1);
          return (add as (...a: unknown[]) => void).call(o, tipo, ...resto);
        } as typeof o.addEventListener;
        o.removeEventListener = function (tipo: string, ...resto: unknown[]) {
          tomados.set(clave(o, tipo), (tomados.get(clave(o, tipo)) ?? 0) - 1);
          return (remove as (...a: unknown[]) => void).call(o, tipo, ...resto);
        } as typeof o.removeEventListener;
      });

      try {
        const fixture = await montar();
        fixture.destroy();

        const sinDevolver = [...tomados]
          .filter(([k, saldo]) => saldo > 0 && DEL_MOTOR.includes(k.split(':')[1]))
          .map(([k]) => k);
        expect(sinDevolver)
          .withContext('listeners que quedaron colgados sobre una vista destruida')
          .toEqual([]);
      } finally {
        objetivos.forEach((o, i) => {
          o.addEventListener = originales[i][0] as typeof o.addEventListener;
          o.removeEventListener = originales[i][1] as typeof o.removeEventListener;
        });
      }
    });
  });
  describe('partida guardada', () => {
    const CLAVE = 'signals-cuaderno';
    let urlOriginal = '';

    beforeEach(() => {
      urlOriginal = location.pathname + location.search + location.hash;
      localStorage.removeItem(CLAVE);
    });
    afterEach(() => {
      history.replaceState(null, '', urlOriginal);
      localStorage.removeItem(CLAVE);
    });

    it('al volver, lo establecido en otra visita vuelve a soldar sus enlaces', async () => {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({ v: 1, establecidos: ['1/0', '3/2'], cinematicas: [], prologo: true }),
      );
      // Abrir en el último capítulo deja detrás todos los enlaces, que es donde se ve la deuda.
      history.replaceState(null, '', `${location.pathname}?nivel=11`);
      const fixture = await montar();
      await hastaElArranque(fixture.nativeElement);

      const enlaces = [...fixture.nativeElement.querySelectorAll('#bonds .bond')] as Element[];
      const soldados = enlaces
        .map((e, j) => (e.classList.contains('on') ? j : -1))
        .filter((j) => j >= 0 && j < 10);
      expect(soldados).toEqual([1, 3]);

      fixture.destroy();
    });

    it('establecer un sistema escribe la partida con su concepto y su sub-nivel', async () => {
      const fixture = await montar();
      await hastaElArranque(fixture.nativeElement);
      const cards = fixture.nativeElement.querySelectorAll('.card--sub');
      const adentro = (cards[2] as HTMLElement).querySelector('.subhost') ?? cards[2];
      adentro.dispatchEvent(new CustomEvent('sistema-establecido', { bubbles: true }));

      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      expect(guardado.establecidos).toEqual(['2/0']);

      fixture.destroy();
    });

    it('con una partida rota arranca igual, sin enlaces soldados', async () => {
      localStorage.setItem(CLAVE, '{esto no es json');
      history.replaceState(null, '', `${location.pathname}?nivel=11`);
      const fixture = await montar();
      await hastaElArranque(fixture.nativeElement);

      const soldados = fixture.nativeElement.querySelectorAll('#bonds .bond.on').length;
      // Solo puede estar encendido el enlace que está naciendo hacia el concepto actual.
      expect(soldados).toBeLessThanOrEqual(1);

      fixture.destroy();
    });
  });
});
