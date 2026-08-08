import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { IntegradaVistaComponent } from './integrada-vista.component';
import { signalsRoutesTree } from '../app.routes';

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
      const rafOriginal = window.requestAnimationFrame;
      let pedidosDespuesDeDestruir = 0;
      let destruido = false;

      window.requestAnimationFrame = function (cb: FrameRequestCallback): number {
        if (destruido) pedidosDespuesDeDestruir++;
        return rafOriginal.call(window, cb);
      };

      try {
        const fixture = await montar();
        fixture.destroy();
        destruido = true;

        // Varios cuadros de margen: un loop vivo se delata en el primero.
        await new Promise((resolve) => setTimeout(resolve, 250));

        expect(pedidosDespuesDeDestruir)
          .withContext('el motor sigue animando sobre una vista que ya no existe')
          .toBe(0);
      } finally {
        window.requestAnimationFrame = rafOriginal;
      }
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
});
