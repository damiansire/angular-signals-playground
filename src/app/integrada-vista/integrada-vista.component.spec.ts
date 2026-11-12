import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { IntegradaVistaComponent } from './integrada-vista.component';
import { cuadrosFalsos, hasta } from './testing/cuadros';
import { CLAVE_PARTIDA } from '../libs/partida';
import { sonido } from '../libs/sonido';

/**
 * La vista de la ruta `/` es el producto entero, y su boot es imperativo: los gates verificaban que
 * el proyecto COMPILA, no que la app ARRANQUE, y el deploy publica en cuanto cierran en verde. Estos
 * tests cubren el arranque real y, sobre todo, el contrato de teardown.
 */
describe('IntegradaVistaComponent', () => {
  /** La colina arranca en `afterNextRender`, que corre después del primer ciclo de detección. */
  async function montar() {
    const fixture = TestBed.createComponent(IntegradaVistaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  /** Lo privado del componente, para manejar el viaje sin jugar la historia entera. */
  const viaje = (fixture: ComponentFixture<IntegradaVistaComponent>) =>
    fixture.componentInstance as unknown as {
      abrirCinematica(capitulo: number): Promise<void>;
      alTerminarCinematica(): void;
      leerEtapa(concepto: number, desde: number): Promise<void>;
    };

  /** Abre la hoja de una etapa y devuelve su `.subhost`, donde se monta la pantalla. */
  async function abrirEtapa(
    fixture: ComponentFixture<IntegradaVistaComponent>,
    concepto: number,
  ): Promise<HTMLElement> {
    void viaje(fixture).leerEtapa(concepto, 0);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('.manual-suelto .subhost') as HTMLElement;
  }

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [IntegradaVistaComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }),
  );
  // La vista guarda dónde quedó la historia: sin esto, cada test le dejaba su lugar al siguiente.
  beforeEach(() => localStorage.removeItem(CLAVE_PARTIDA));
  afterEach(() => localStorage.removeItem(CLAVE_PARTIDA));

  it('arranca sin tirar, en la colina, y sin nada de la molécula (ADR 0021)', async () => {
    const fixture = await montar();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('#stage')).withContext('#stage').toBeTruthy();
    expect(host.querySelector('.intro .tusi')).withContext('la colina').toBeTruthy();
    for (const molecula of ['svg.mol', '#atoms', '#bonds', '.card--sub', '.topbar', '.rail']) {
      expect(host.querySelector(molecula)).withContext(molecula).toBeNull();
    }

    fixture.destroy();
  });

  describe('la colina tapada por el viaje', () => {
    it('una cinemática la tapa: deja de animar y de recibir foco, y vuelve al terminar', async () => {
      const fixture = await montar();
      const intro = fixture.nativeElement.querySelector('.intro') as HTMLElement;
      expect(intro.classList).not.toContain('intro--fuera');

      await viaje(fixture).abrirCinematica(1);
      await fixture.whenStable();
      expect(intro.classList).withContext('tapada').toContain('intro--fuera');
      expect(intro.inert).toBeTrue();

      viaje(fixture).alTerminarCinematica();
      await fixture.whenStable();
      expect(intro.classList).withContext('a la vista').not.toContain('intro--fuera');
      expect(intro.inert).toBeFalse();
      fixture.destroy();
    });

    it('la hoja de una etapa también la tapa', async () => {
      const fixture = await montar();
      const intro = fixture.nativeElement.querySelector('.intro') as HTMLElement;

      expect(await abrirEtapa(fixture, 0))
        .withContext('la hoja')
        .toBeTruthy();
      expect(intro.classList).toContain('intro--fuera');
      fixture.destroy();
    });
  });

  describe('pausa de la vida de fondo (WCAG 2.2.2)', () => {
    const CLAVE = 'signals-pausa';
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

    /** El botón de la pausa, en la colina junto al sonido. */
    const boton = (host: HTMLElement): HTMLButtonElement =>
      host.querySelector<HTMLButtonElement>('.ini__ajustes .tusi__ov-pausa')!;

    /** Un elemento con una animación CSS, colgado dentro de la vista. */
    function animado(padre: Element, animacion: string): Animation {
      const el = document.createElement('div');
      el.style.animation = animacion;
      padre.appendChild(el);
      return el.getAnimations()[0];
    }

    /** `animationstart` visto desde `document`: burbujea después del handler de la pausa. */
    const arranco = (animacion: Animation): Promise<void> =>
      new Promise((listo) => {
        const el = (animacion.effect as KeyframeEffect).target;
        const alArrancar = (e: Event): void => {
          if (e.target !== el) return;
          document.removeEventListener('animationstart', alArrancar);
          listo();
        };
        document.addEventListener('animationstart', alArrancar);
      });

    it('detiene los loops, termina las entradas y no toca lo que el jugador abrió encima', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const loop = animado(host, 'prueba-loop 1s linear infinite');
      // Una entrada que arranca invisible: congelada en su primer cuadro no se vería nunca.
      const entrada = animado(host, 'prueba-entrada 10s both');
      const cinematica = host.appendChild(document.createElement('app-cinematica'));
      const encima = animado(cinematica, 'prueba-entrada 10s both');

      expect(boton(host).textContent).toContain('tocá para pausar');
      boton(host).click();
      fixture.detectChanges();
      expect(boton(host).textContent)
        .withContext('la etiqueta dice lo que hace')
        .toContain('tocá para reanudar');
      expect(host.classList).toContain('fondo-en-pausa');
      const quieto = loop.currentTime;
      await new Promise((r) => setTimeout(r, 120));
      expect(loop.currentTime).withContext('loop').toBe(quieto);
      expect(entrada.playState).withContext('entrada').toBe('finished');
      expect(encima.playState).withContext('cinemática').toBe('running');

      boton(host).click();
      expect(host.classList).not.toContain('fondo-en-pausa');
      expect(loop.playbackRate).withContext('loop reanudado').toBe(1);
      fixture.destroy();
    });

    it('no termina lo que sigue al scroll: el aviso de "más abajo" no es vida de fondo', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const hoja = host.appendChild(document.createElement('div'));
      hoja.style.cssText = 'overflow-y: auto; height: 40px';
      const aviso = hoja.appendChild(document.createElement('div'));
      aviso.style.cssText =
        'height: 400px; animation: prueba-entrada linear both; animation-timeline: scroll(nearest block)';
      const animacion = aviso.getAnimations()[0];

      boton(host).click();
      expect(animacion.playState).withContext('sigue al scroll').not.toBe('finished');
      boton(host).click();
      fixture.destroy();
    });

    it('se guarda al elegirla y se borra al sacarla', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;

      boton(host).click();
      expect(localStorage.getItem(CLAVE)).toBe('1');
      boton(host).click();
      expect(localStorage.getItem(CLAVE)).toBeNull();
      fixture.destroy();
    });

    it('reanudar no revive un loop que el CSS canceló mientras duraba la pausa', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const loop = animado(host, 'prueba-loop 1s linear infinite');

      boton(host).click();
      // Como el halo de algo que deja de estar en pantalla: el CSS le saca la animación.
      (loop.effect as KeyframeEffect).target!.setAttribute('style', 'animation: none');
      expect(loop.playState).toBe('idle');
      boton(host).click();
      expect(loop.playState).withContext('sigue cancelado').toBe('idle');
      fixture.destroy();
    });

    it('después de una pausa, la pestaña oculta sigue congelando por CSS', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const loop = animado(host, 'prueba-loop 1s linear infinite');

      boton(host).click();
      boton(host).click();
      host.classList.add('anims-frozen'); // lo que pone la pausa con `document.hidden`
      expect(loop.playState).toBe('paused');
      host.classList.remove('anims-frozen');
      fixture.destroy();
    });

    it('lo que arranca con la pausa puesta ya nace quieto', async () => {
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      boton(host).click();

      const entrada = animado(host, 'prueba-entrada 10s both');
      await arranco(entrada);
      expect(entrada.playState).toBe('finished');
      fixture.destroy();
    });

    it('se recuerda entre visitas', async () => {
      localStorage.setItem(CLAVE, '1');
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      const loop = animado(host, 'prueba-loop 1s linear infinite');
      await hasta(() => loop.playbackRate === 0); // la pausa guardada frena el loop

      expect(host.classList).toContain('fondo-en-pausa');
      expect(boton(host).textContent).toContain('tocá para reanudar');
      expect(loop.playbackRate).toBe(0);
      fixture.destroy();
    });
  });

  describe('la colina no baja (ADR 0019)', () => {
    it('una flecha libre no mueve el escenario', async () => {
      const fixture = await montar();
      const stage = fixture.nativeElement.querySelector('#stage') as HTMLElement;
      const antes = stage.scrollTop;

      const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
      window.dispatchEvent(e);
      await new Promise((r) => setTimeout(r, 700)); // más que el glide más largo que había (620 ms)

      expect(stage.scrollTop).toBe(antes);
      expect(e.defaultPrevented).toBeFalse();
      fixture.destroy();
    });
  });

  describe('la hoja de una etapa', () => {
    /**
     * Con la pantalla montada, las naves y el circuito miden con `ResizeObserver`, y el navegador
     * avisa por `window.onerror` cuando una medición queda para el cuadro siguiente. No es una falla:
     * la medición llega igual. Jasmine toma cualquier `onerror` como excepción del spec: acá se
     * cuentan todas menos ese aviso. Llega un cuadro después de la medición, así que se esperan unos
     * cuadros antes de contar.
     */
    const sinElAvisoDelResizeObserver = (cuerpo: () => Promise<void>) => () =>
      jasmine.spyOnGlobalErrorsAsync(async (errores) => {
        await cuerpo();
        for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
        const excepciones = errores.calls
          .allArgs()
          .filter(([error]) => !String(error).includes('ResizeObserver loop completed'));
        expect(excepciones).withContext('excepciones globales').toEqual([]);
      });

    it(
      'monta el componente REAL de la pantalla dentro de la .subhost, y renderiza algo',
      sinElAvisoDelResizeObserver(async () => {
        const fixture = await montar();
        const subhost = await abrirEtapa(fixture, 0);
        expect(subhost).toBeTruthy();
        // La pantalla llega diferida: se espera la carga, no se da por vacía antes.
        await hasta(() => subhost.childElementCount > 0);

        expect(subhost.childElementCount)
          .withContext('la hoja se montó vacía: el montaje degrada sin ruido')
          .toBeGreaterThan(0);
        expect(subhost.textContent?.trim().length)
          .withContext('el componente montó pero no pintó nada')
          .toBeGreaterThan(0);

        fixture.destroy();
      }),
    );

    it(
      'al destruir se lleva el componente montado pero NO la .subhost que lo aloja',
      sinElAvisoDelResizeObserver(async () => {
        const fixture = await montar();
        const subhost = await abrirEtapa(fixture, 0);
        await hasta(() => subhost.childElementCount > 0);
        const montado = subhost.firstElementChild;

        expect(montado).toBeTruthy();

        fixture.destroy();

        // El disposer usa un nodo propio justamente para no borrar la .subhost.
        expect(subhost.contains(montado)).toBeFalse();
      }),
    );
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
      // 250 ms de reloj real: se le anotaban a la vista los de cualquier otro código de la página de
      // Karma, y un cuadro que el cierre olvidaba cancelar no se veía, porque no pide otro.
      const cuadros = cuadrosFalsos();
      const fixture = await montar();
      expect(cuadros.pendientes())
        .withContext('la colina arranca con cuadros pedidos: sin eso no hay nada que cortar')
        .toBeGreaterThan(0);

      fixture.destroy();
      // Destruir le avisa al scheduler zoneless de Angular, que pide un cuadro y lo cancela en su
      // propio setTimeout(0), agendado antes que este: al volver, lo pendiente es solo de la vista.
      await new Promise((r) => setTimeout(r));

      expect(cuadros.pendientes())
        .withContext('la vista sigue animando aunque ya no existe')
        .toBe(0);
    });

    it('la mirada que pidió el mouse no queda pidiendo su cuadro', async () => {
      const fixture = await montar();
      await abrirEtapa(fixture, 1);
      const cuadros = cuadrosFalsos();
      const hoja = fixture.nativeElement.querySelector('.prologo__manual') as HTMLElement;
      hoja.dispatchEvent(
        new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 40, clientY: 40 }),
      );
      expect(cuadros.pendientes())
        .withContext('mover el mouse sobre la etapa pide un cuadro para la mirada')
        .toBeGreaterThan(0);

      fixture.destroy();
      await new Promise((r) => setTimeout(r));

      expect(cuadros.pendientes()).toBe(0);
    });

    it('al irse corta la voz que estaba sonando', async () => {
      const fixture = await montar();
      const callar = spyOn(sonido(), 'callar').and.callThrough();
      fixture.destroy();
      expect(callar).toHaveBeenCalled();
    });

    it('devuelve todos los listeners globales que tomó', async () => {
      // Solo los que toma la vista. `popstate`/`hashchange` son del Router de Angular, que vive
      // más allá de esta vista y los suelta con el entorno de test, no con `fixture.destroy()`:
      // incluirlos haría fallar el test por algo que no es responsabilidad de este módulo.
      const DE_LA_VISTA = ['keydown', 'resize', 'load', 'visibilitychange', 'wheel', 'touchmove'];
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
          .filter(([k, saldo]) => saldo > 0 && DE_LA_VISTA.includes(k.split(':')[1]))
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

    it('un desafío resuelto en una etapa escribe la partida con su concepto y su página', async () => {
      const fixture = await montar();
      const subhost = await abrirEtapa(fixture, 2);
      subhost.dispatchEvent(new CustomEvent('sistema-establecido', { bubbles: true }));

      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      expect(guardado.establecidos).toEqual(['2/0']);

      fixture.destroy();
    });

    it('lo establecido en otra visita se conserva al anotar lo nuevo', async () => {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({
          v: 4,
          establecidos: ['0/1'],
          cinematicas: [],
          prologo: true,
          punto: null,
        }),
      );
      const fixture = await montar();
      const subhost = await abrirEtapa(fixture, 2);
      subhost.dispatchEvent(new CustomEvent('sistema-establecido', { bubbles: true }));

      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      expect(guardado.establecidos).toEqual(['0/1', '2/0']);
      fixture.destroy();
    });

    it('un desafío de la historia (el manual, el árbol) no marca nada en el viaje', async () => {
      const fixture = await montar();
      // Las hojas del prólogo viven adentro del escenario, no en una etapa.
      const hoja = document.createElement('section');
      fixture.nativeElement.querySelector('#stage').append(hoja);
      hoja.dispatchEvent(new CustomEvent('sistema-establecido', { bubbles: true }));

      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      expect(guardado.establecidos ?? []).toEqual([]);
      fixture.destroy();
    });

    it('al recargar sin link, una partida que quedó en la molécula sigue en la colina', async () => {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({
          v: 4,
          establecidos: [],
          cinematicas: [],
          prologo: true,
          punto: { lugar: 'recorrido', concepto: 9, sub: -1 },
        }),
      );
      history.replaceState(null, '', location.pathname);
      const fixture = await montar();
      const host: HTMLElement = fixture.nativeElement;
      await new Promise((listo) => setTimeout(listo, 300));
      // La historia es una sola: nada se abre hasta que se entra desde la colina.
      expect(host.querySelector('.manual-suelto')).toBeNull();
      expect(host.querySelector('app-cinematica')).toBeNull();
      expect(location.search).not.toContain('nivel');
      fixture.destroy();
    });

    it('un link a un capítulo guarda el viaje en su cinemática', async () => {
      history.replaceState(null, '', `${location.pathname}?nivel=4`);
      const fixture = await montar();
      await hasta(() => localStorage.getItem(CLAVE) !== null);

      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      // `nivel` es el número de capítulo, no la posición: el 4 es el cuarto concepto desde 0 = 3.
      expect(guardado.punto).toEqual({ lugar: 'viaje' });
      expect(guardado.viaje).toEqual({ concepto: 3, pagina: -1 });
      fixture.destroy();
    });

    it('con una partida rota arranca igual, y el link la reemplaza por una sana', async () => {
      localStorage.setItem(CLAVE, '{esto no es json');
      history.replaceState(null, '', `${location.pathname}?nivel=11`);
      const fixture = await montar();
      await hasta(() => localStorage.getItem(CLAVE)?.startsWith('{"v"') ?? false);

      expect(fixture.componentInstance.bootFallo()).toBeFalse();
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
      expect(guardado.establecidos).toEqual([]);
      expect(guardado.viaje).toEqual({ concepto: 10, pagina: -1 });

      fixture.destroy();
    });
  });
});
