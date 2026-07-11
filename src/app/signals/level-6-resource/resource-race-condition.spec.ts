import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, resource, signal } from '@angular/core';

/**
 * resource() descarta el resultado de una petición vieja si una petición más
 * nueva ya está en vuelo (comportamiento real de resource(), no un mock): el
 * loader de cada request se resuelve con un `deferred` propio, controlado a
 * mano, para poder resolver el request VIEJO después del NUEVO y verificar
 * que el valor final es el del request nuevo, no el viejo llegando tarde.
 *
 * El dispatch de `params`/`loader` corre en un `effect()` interno, que en
 * zoneless no se vuelca solo: `TestBed.flushEffects()` lo fuerza en el
 * momento exacto que necesita cada aserción.
 */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('resource() — race condition entre requests sucesivos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('ignora el resultado de un request viejo que resuelve después de uno más nuevo', async () => {
    const deferredsById = new Map<number, ReturnType<typeof createDeferred<string>>>();

    const id = signal(1);
    const userResource = TestBed.runInInjectionContext(() =>
      resource({
        params: () => id(),
        loader: ({ params }) => {
          const deferred = createDeferred<string>();
          deferredsById.set(params, deferred);
          return deferred.promise;
        },
      }),
    );
    TestBed.flushEffects();

    // Dispara el request #1, luego cambia la fuente antes de que resuelva:
    // resource() abandona el request #1 y arranca el #2.
    expect(deferredsById.has(1)).toBe(true);
    id.set(2);
    TestBed.flushEffects();
    expect(deferredsById.has(2)).toBe(true);

    // El request #2 (el vigente) resuelve primero...
    deferredsById.get(2)!.resolve('user-2');
    await Promise.resolve();
    await Promise.resolve();
    expect(userResource.value()).toBe('user-2');

    // ...y el request #1 (viejo) resuelve tarde: no debe pisar el valor vigente.
    deferredsById.get(1)!.resolve('user-1-stale');
    await Promise.resolve();
    await Promise.resolve();
    expect(userResource.value()).toBe('user-2');
    expect(userResource.status()).toBe('resolved');
  });

  it('adopta el valor del request más nuevo aunque el viejo nunca resuelva', async () => {
    const deferredsById = new Map<number, ReturnType<typeof createDeferred<string>>>();

    const id = signal(1);
    const userResource = TestBed.runInInjectionContext(() =>
      resource({
        params: () => id(),
        loader: ({ params }) => {
          const deferred = createDeferred<string>();
          deferredsById.set(params, deferred);
          return deferred.promise;
        },
      }),
    );
    TestBed.flushEffects();

    id.set(2);
    TestBed.flushEffects();
    id.set(3);
    TestBed.flushEffects();

    // El request #1 y #2 quedan colgados para siempre; solo el #3 resuelve.
    deferredsById.get(3)!.resolve('user-3');
    await Promise.resolve();
    await Promise.resolve();

    expect(userResource.value()).toBe('user-3');
    expect(userResource.status()).toBe('resolved');
  });
});
