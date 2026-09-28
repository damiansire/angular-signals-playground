/**
 * Resortes a mano, convertidos en una curva de CSS.
 *
 * Un resorte no es una curva de Bézier: puede pasarse del destino y volver, y su duración sale de
 * la física, no de un número elegido a ojo. CSS no sabe simular uno, pero desde `linear()` acepta
 * cualquier curva como una lista de puntos. Así que el resorte se resuelve UNA vez acá, en forma
 * cerrada, y la animación la corre el compositor del navegador: cero `requestAnimationFrame`, cero
 * JavaScript por cuadro, y se pausa sola con `animation-play-state`.
 *
 * La ecuación es la del oscilador amortiguado, `m·x'' + c·x' + k·x = 0`, con `x` la distancia que
 * falta hasta el destino. El progreso que ve CSS es `1 + x`, que arranca en 0 y termina en 1.
 */

export interface Resorte {
  /** Rigidez `k`: cuánto tira hacia el destino. Más rígido, más rápido. */
  readonly rigidez: number;
  /** Amortiguación `c`: cuánto frena. Con poca, rebota. */
  readonly amortiguacion: number;
  /** Masa `m`. Más pesado, más lento y con más inercia. */
  readonly masa?: number;
  /** Velocidad inicial, en progresos por segundo. Positiva empuja hacia el destino. */
  readonly velocidad?: number;
}

export interface CurvaResorte {
  /** Valor listo para `animation-timing-function` / `transition-timing-function`. */
  readonly easing: string;
  /** Cuánto tarda en asentarse, redondeado a milisegundos enteros. */
  readonly ms: number;
  /** Cuánto se pasa del destino, en fracción (0.15 = 15 % más allá). 0 si no rebota. */
  readonly sobrepaso: number;
}

/**
 * Los tres resortes con los que se coreografía todo. Pocos a propósito: si cada elemento trae su
 * propio resorte, el movimiento deja de tener un carácter y pasa a ser ruido.
 */
export const RESORTES = {
  /** Casi crítico: llega sin rebotar. Para lo que entra a ocupar su lugar (texto, paneles). */
  suave: { rigidez: 170, amortiguacion: 26 },
  /** Rebota una vez y se asienta. Solo para el héroe de cada escena: es el que tiene peso. */
  rebote: { rigidez: 300, amortiguacion: 18 },
  /** Crítico y rápido. Para lo que se va o responde a un toque: salir tiene que costar menos. */
  firme: { rigidez: 420, amortiguacion: 41 },
} as const satisfies Record<string, Resorte>;

export type NombreResorte = keyof typeof RESORTES;

/** Posición `x(t)` y velocidad `v(t)` del resorte, en forma cerrada. `x` arranca en -1. */
function solucion(r: Resorte): (t: number) => { x: number; v: number } {
  const m = r.masa ?? 1;
  const k = r.rigidez;
  const c = r.amortiguacion;
  const v0 = r.velocidad ?? 0;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const x0 = -1;

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const a = x0;
    const b = (v0 + zeta * w0 * a) / wd;
    return (t) => {
      const e = Math.exp(-zeta * w0 * t);
      const cos = Math.cos(wd * t);
      const sin = Math.sin(wd * t);
      const x = e * (a * cos + b * sin);
      const v = e * ((b * wd - zeta * w0 * a) * cos - (a * wd + zeta * w0 * b) * sin);
      return { x, v };
    };
  }

  if (zeta === 1) {
    const a = x0;
    const b = v0 + w0 * a;
    return (t) => {
      const e = Math.exp(-w0 * t);
      return { x: (a + b * t) * e, v: (b - w0 * (a + b * t)) * e };
    };
  }

  // Sobreamortiguado: dos exponenciales reales. Se usa poco, pero un resorte "firme" mal tuneado
  // cae acá y no puede devolver NaN.
  const raiz = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - raiz);
  const r2 = -w0 * (zeta + raiz);
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  const c1 = x0 - c2;
  return (t) => ({
    x: c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t),
    v: c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t),
  });
}

/**
 * Resuelve el resorte y lo muestrea como una curva `linear()` de puntos equiespaciados.
 *
 * La duración es el último instante en que el resorte todavía está a más de `tolerancia` del
 * destino (o se mueve a más de diez veces eso por segundo): cortar antes deja un salto visible al
 * final, cortar después agrega una cola quieta que se siente como lag.
 */
export function curvaDeResorte(
  resorte: Resorte,
  opciones: { readonly tolerancia?: number; readonly puntos?: number } = {},
): CurvaResorte {
  if (!(resorte.rigidez > 0) || !(resorte.amortiguacion >= 0) || !((resorte.masa ?? 1) > 0)) {
    throw new Error(
      'resorte: rigidez y masa tienen que ser positivas, y la amortiguación no negativa',
    );
  }
  const tolerancia = opciones.tolerancia ?? 0.001;
  const puntos = Math.max(8, Math.round(opciones.puntos ?? 48));
  const en = solucion(resorte);

  const PASO = 1 / 240;
  const TOPE = 6;
  let asentado = 0;
  let sobrepaso = 0;
  for (let t = 0; t <= TOPE; t += PASO) {
    const { x, v } = en(t);
    if (x > sobrepaso) sobrepaso = x;
    if (Math.abs(x) > tolerancia || Math.abs(v) > tolerancia * 10) asentado = t;
  }
  const duracion = Math.min(TOPE, asentado + PASO);

  const muestras: string[] = [];
  for (let i = 0; i <= puntos; i++) {
    const t = (duracion * i) / puntos;
    const progreso = i === puntos ? 1 : i === 0 ? 0 : 1 + en(t).x;
    muestras.push(redondear(progreso));
  }

  return {
    easing: `linear(${muestras.join(', ')})`,
    ms: Math.round(duracion * 1000),
    sobrepaso: Number(sobrepaso.toFixed(4)),
  };
}

/** Cuatro decimales alcanzan para que no se vea el escalón y la cadena no pese de más. */
function redondear(n: number): string {
  const r = Math.round(n * 10000) / 10000;
  return Object.is(r, -0) ? '0' : String(r);
}

/**
 * Las curvas de los resortes con nombre como propiedades CSS (`--resorte-suave` y
 * `--resorte-suave-ms`, etc.), para colgarlas de un elemento raíz y usarlas desde las hojas de
 * estilo. Se calculan una sola vez por pantalla.
 */
export function variablesDeResorte(): Readonly<Record<string, string>> {
  const variables: Record<string, string> = {};
  for (const nombre of Object.keys(RESORTES) as NombreResorte[]) {
    const curva = curvaDeResorte(RESORTES[nombre]);
    variables[`--resorte-${nombre}`] = curva.easing;
    variables[`--resorte-${nombre}-ms`] = `${curva.ms}ms`;
  }
  return variables;
}
