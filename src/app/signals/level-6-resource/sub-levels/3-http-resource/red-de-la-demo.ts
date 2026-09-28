import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize, switchMap, tap, timer } from 'rxjs';

/** El código HTTP con el que volvió, o `cancelado` si alguien dejó de esperarlo antes. */
export type Destino = 'viaja' | 'cancelado' | number;

export interface Pedido {
  readonly n: number;
  readonly url: string;
  readonly destino: Destino;
}

const VISIBLES = 4;

/**
 * Lo mismo que se usa en el 6/1 para que el viaje se vea. Sin esto un JSON local vuelve en pocos
 * milisegundos, no da tiempo a cambiar de tripulante con el pedido en vuelo y la cancelación, que
 * es la mitad de la lección, no llega a verse nunca.
 */
export const LATENCIA_MS = 800;

/** Los últimos pedidos que salieron por HttpClient y cómo terminó cada uno. */
@Injectable()
export class RedDeLaDemo {
  private enviados = 0;
  private readonly registro = signal<readonly Pedido[]>([]);
  readonly pedidos = this.registro.asReadonly();

  salio(url: string): number {
    const n = ++this.enviados;
    const nuevo: Pedido = { n, url, destino: 'viaja' };
    this.registro.update((pedidos) => [nuevo, ...pedidos].slice(0, VISIBLES));
    return n;
  }

  termino(n: number, destino: Exclude<Destino, 'viaja'>): void {
    this.registro.update((pedidos) => pedidos.map((p) => (p.n === n ? { ...p, destino } : p)));
  }
}

/**
 * Anota cada pedido. Si la suscripción se cierra sin respuesta es que httpResource lo soltó al
 * cambiar la URL: eso es lo que en el 6/1 había que cablear a mano con el abortSignal.
 */
export const anotarEnLaRed: HttpInterceptorFn = (req, next) => {
  const red = inject(RedDeLaDemo);
  const n = red.salio(req.url);
  let volvio = false;
  return next(req).pipe(
    tap({
      next: (evento) => {
        if (evento.type !== HttpEventType.Response) return;
        volvio = true;
        red.termino(n, evento.status);
      },
      error: (error: unknown) => {
        volvio = true;
        red.termino(n, error instanceof HttpErrorResponse ? error.status : 0);
      },
    }),
    finalize(() => {
      if (!volvio) red.termino(n, 'cancelado');
    }),
  );
};

/** La espera va ANTES de mandar: cancelar durante la espera es no llegar a pedir. */
export const demorarLaRed: HttpInterceptorFn = (req, next) =>
  timer(LATENCIA_MS).pipe(switchMap(() => next(req)));
