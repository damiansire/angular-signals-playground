/**
 * Física del toque: lo que responde a un dedo no puede ser una curva resuelta de antemano.
 *
 * `libs/resorte.ts` resuelve resortes en forma cerrada para que los corra CSS, y sirve cuando se
 * sabe dónde empieza y dónde termina el viaje. Un toque no lo sabe: llega en cualquier momento, se
 * suma al anterior y el dedo puede estar tirando. Acá cada muelle guarda posición y velocidad, y
 * un toque suma velocidad en vez de fijar una pose: por eso los clicks se acumulan y nada queda a
 * medio camino, aunque toquen veinte veces seguidas.
 */

export interface Muelle {
  /** Posición actual. */
  x: number;
  /** Velocidad actual, en unidades por segundo. */
  v: number;
  /** Destino: adonde tira el muelle. */
  destino: number;
  /** Rigidez: cuánto tira. */
  readonly k: number;
  /** Amortiguación: cuánto frena. Con poca oscila varias veces, y eso es la gelatina. */
  readonly d: number;
}

export function crearMuelle(x: number, k = 180, d = 16): Muelle {
  return { x, v: 0, destino: x, k, d };
}

/** Un cuadro largo (pestaña que vuelve, GC) no puede meterle energía al sistema: el paso se topa. */
export const PASO_MAXIMO_S = 0.034;

/** Por debajo de esto ya no se ve: el motor puede dormirse. */
const QUIETO_X = 0.002;
const QUIETO_V = 0.02;

/**
 * Avanza un muelle `dt` segundos, con Euler semi-implícito y dos sub-pasos: es estable con las
 * rigideces que se usan acá, y un Euler común le suma energía y termina explotando.
 */
export function avanzarMuelle(m: Muelle, dt: number): void {
  const paso = Math.min(Math.max(dt, 0), PASO_MAXIMO_S) / 2;
  for (let i = 0; i < 2; i++) {
    m.v += (-(m.x - m.destino) * m.k - m.v * m.d) * paso;
    m.x += m.v * paso;
  }
}

export function enReposo(m: Muelle): boolean {
  return Math.abs(m.x - m.destino) < QUIETO_X && Math.abs(m.v) < QUIETO_V;
}

/** Lo deja exacto en su destino: sin esto el último cuadro queda a milésimas y nunca es la pose. */
export function asentar(m: Muelle): void {
  m.x = m.destino;
  m.v = 0;
}

export function limitar(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Cuánto de un golpe llega a algo que está a `distancia` del punto: cae con la distancia pero nunca
 * llega a cero, porque en un mundo que responde hasta lo lejano se entera un poco.
 */
export function alcanceDelGolpe(distancia: number, radio = 900): number {
  return limitar(1 - distancia / radio, 0.12, 1);
}

/** Hasta dónde deja estirar el agarre: el tirón tiene que costar cada vez más, nunca cortarse. */
export function tironElastico(distancia: number, tope = 90): number {
  return (tope * distancia) / (tope + Math.abs(distancia));
}

/**
 * Un solo reloj para todo lo elástico de la pantalla, y solo mientras algo se mueva: con todo en
 * reposo no queda ningún `requestAnimationFrame` agendado (lo exige el checklist de diseño).
 */
export interface MotorDeMuelles {
  /** Registra un cuerpo. `cuadro` devuelve si sigue en movimiento. Devuelve cómo sacarlo. */
  agregar(cuadro: (dt: number) => boolean): () => void;
  /** Avisa que hay algo para mover: despierta el reloj si estaba dormido. */
  despertar(): void;
  /** Si hay un cuadro agendado. Es lo que permite comprobar que el motor se duerme. */
  despierto(): boolean;
}

export function crearMotor(
  pedirCuadro: (fn: (ts: number) => void) => number = (fn) => requestAnimationFrame(fn),
): MotorDeMuelles {
  const cuerpos = new Set<(dt: number) => boolean>();
  let agendado = false;
  let ultimo = 0;

  const correr = (ts: number): void => {
    agendado = false;
    const dt = ultimo === 0 ? 1 / 60 : (ts - ultimo) / 1000;
    ultimo = ts;
    let sigue = false;
    for (const cuerpo of cuerpos) if (cuerpo(dt)) sigue = true;
    if (sigue) agendar();
    else ultimo = 0;
  };
  const agendar = (): void => {
    if (agendado || cuerpos.size === 0) return;
    agendado = true;
    pedirCuadro(correr);
  };

  return {
    agregar(cuadro) {
      cuerpos.add(cuadro);
      return () => cuerpos.delete(cuadro);
    },
    despertar: agendar,
    despierto: () => agendado,
  };
}

/** El reloj compartido de la app. Diferido: en un test o en el servidor no hay `requestAnimationFrame`. */
let motorCompartido: MotorDeMuelles | null = null;
export function motorDeMuelles(): MotorDeMuelles {
  return (motorCompartido ??= crearMotor());
}

/** Golpe que corre por la pantalla: lo escucha quien quiera reaccionar (la mascota, los átomos). */
export const IMPACTO = 'impacto-vivo';

export interface DetalleDeImpacto {
  /** Punto del golpe, en coordenadas de la ventana. */
  readonly x: number;
  readonly y: number;
  /** Fuerza entre 0 y 1. */
  readonly fuerza: number;
}

export function emitirImpacto(origen: EventTarget, detalle: DetalleDeImpacto): void {
  origen.dispatchEvent(
    new CustomEvent(IMPACTO, { bubbles: true, composed: true, detail: detalle }),
  );
}

/** Sin movimiento hay estado final, no viaje. Se consulta en cada toque: cambia en vivo. */
export function sinMovimiento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
