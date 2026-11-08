import type { SalidaDeAudio } from '../../libs/sonido';
import { azar } from '../inicio-angie';

/**
 * La prueba de auriculares que suena al activar el sonido: una cajita de música primero en el oído
 * izquierdo, después en el derecho y al final en los dos. Con auriculares se oye moverse de lado a
 * lado, y eso es lo que dice que están bien puestos; el dibujo enciende cada copa cuando le toca.
 */

export type Lado = 'izquierda' | 'derecha' | 'ambos';

export interface NotaDePrueba {
  /** Desde el toque, en segundos. */
  readonly t: number;
  readonly hz: number;
  readonly lado: Lado;
  /** Cuánto tarda en apagarse, en segundos. */
  readonly dura: number;
  readonly volumen: number;
}

/** No del todo a un lado: el 100% en un solo oído se siente como un auricular roto. */
export const PANEO: Readonly<Record<Lado, number>> = { izquierda: -0.85, derecha: 0.85, ambos: 0 };

/** Re mayor: re y la a la izquierda, mi y si a la derecha, y el acorde entero en el medio. */
export function planDeLaPrueba(): readonly NotaDePrueba[] {
  const caja = (t: number, hz: number, lado: Lado, volumen = 0.07): NotaDePrueba => ({
    t,
    hz,
    lado,
    dura: 1.4,
    volumen,
  });
  return [
    caja(0, 587.33, 'izquierda'),
    caja(0.14, 880, 'izquierda'),
    caja(0.46, 659.25, 'derecha'),
    caja(0.6, 987.77, 'derecha'),
    // El acorde se arpegia: cuatro notas juntas en el mismo instante suenan a golpe, no a cajita.
    caja(0.98, 587.33, 'ambos', 0.05),
    caja(1.04, 739.99, 'ambos', 0.05),
    caja(1.1, 880, 'ambos', 0.05),
    caja(1.16, 1174.66, 'ambos', 0.05),
  ];
}

/** Cuándo empieza a sonar cada lado: el dibujo enciende esa copa en ese momento. */
export function cuandoSuena(plan: readonly NotaDePrueba[], lado: Lado): number {
  const primera = plan.find((n) => n.lado === lado);
  if (!primera) throw new Error(`prueba de auriculares: no suena nada del lado ${lado}`);
  return primera.t;
}

/** El telón sube con la última nota todavía sonando: esperar el silencio se sentía lento. */
export function cuandoSeAbre(plan: readonly NotaDePrueba[]): number {
  return Math.max(...plan.map((n) => n.t)) + 0.3;
}

/** Agenda la prueba en la salida común. Sin audio, o con un navegador sin paneo, no tira. */
export function tocarPrueba(salida: SalidaDeAudio, plan: readonly NotaDePrueba[]): void {
  const { ctx } = salida;
  try {
    const cero = ctx.currentTime + 0.02;
    for (const n of plan) {
      const desde = cero + n.t;
      const fin = desde + n.dura;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, desde);
      env.gain.linearRampToValueAtTime(n.volumen, desde + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, fin);
      if (typeof ctx.createStereoPanner === 'function') {
        const paneo = ctx.createStereoPanner();
        paneo.pan.value = PANEO[n.lado];
        env.connect(paneo).connect(salida.salida);
      } else {
        env.connect(salida.salida);
      }
      // Los armónicos, como la cajita de la despedida: así las dos músicas son del mismo mundo.
      for (const [mul, amp] of [
        [1, 1],
        [2, 0.35],
        [3, 0.12],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.frequency.value = n.hz * mul;
        const g = ctx.createGain();
        g.gain.value = amp;
        osc.connect(g).connect(env);
        osc.start(desde);
        osc.stop(fin + 0.05);
      }
    }
  } catch {
    // Sin audio la cortina sube igual, en silencio.
  }
}

export interface EstrellaDelAlba {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Desfase del titileo, en segundos: todas a la vez se leían como un cartel encendiéndose. */
  readonly retraso: number;
}

/**
 * Las estrellas de antes del amanecer, en el dibujo de 1920 × 1080. Solo en la mitad de arriba: abajo
 * ya clarea.
 */
export function estrellasDelAlba(semilla: number, cantidad: number): EstrellaDelAlba[] {
  const r = azar(semilla);
  return Array.from({ length: cantidad }, () => ({
    x: Math.round(r() * 1920),
    y: Math.round(r() * r() * 600),
    r: +(1 + r() * 2.2).toFixed(1),
    retraso: +(r() * 4).toFixed(2),
  }));
}

/** Lo que invita a seguir: no es un botón a la vista, es la frase que dice que se toca en cualquier lado. */
export const LLAMADO = 'Hacé click en cualquier lado para continuar';
/** Lo mismo en una pantalla táctil, donde no hay click ni cursor: se toca. */
export const LLAMADO_TACTIL = 'Tocá en cualquier lado para continuar';

export interface LetraDelLlamado {
  readonly c: string;
  /** Su lugar en la frase entera: la ola la recorre de punta a punta, sin reiniciar en cada palabra. */
  readonly i: number;
}

/** La frase en palabras y letras, para que una ola la recorra. Las palabras no se cortan al bajar de renglón. */
export function letrasDelLlamado(frase: string): LetraDelLlamado[][] {
  let i = 0;
  return frase
    .split(' ')
    .filter(Boolean)
    .map((palabra) => [...palabra].map((c) => ({ c, i: i++ })));
}

/**
 * La bocanada (ver el CSS del componente) es un círculo blando centrado en la boca de Angie, que
 * crece con `--aa-aire`: con aire `a` tapa del todo hasta `NUCLEO * a` y se desvanece hasta `a`. Un
 * círculo que se cierra en la boca es el final de dibujo animado; las nubes oscuras que tenía antes
 * se leían como el humo de una explosión.
 */
export const NUCLEO = 0.86;

/** El aire con el que la bocanada tapa el aviso entero: arranca sin que se note el recorte. */
export function aireQueCubre(x: number, y: number, ancho: number, alto: number): number {
  return (1.02 * Math.hypot(Math.max(x, ancho - x), Math.max(y, alto - y))) / NUCLEO;
}

/** El aire más grande con el que la bocanada queda adentro del aviso, sin tocar sus bordes. */
export function aireQueCabe(x: number, y: number, ancho: number, alto: number): number {
  return 0.95 * Math.min(x, ancho - x, y, alto - y);
}

/**
 * Los cuadros clave del aire, como `[offset, aire]`: de tapar todo a encajar en `encaja`, y de ahí a
 * cerrarse en la boca. El primer tramo va parejo en escala (cada paso achica lo mismo), así la nube
 * se forma de a poco: en línea recta, casi todo ese tramo pasaba con la pantalla todavía tapada.
 */
export function caminoDelAire(
  cubre: number,
  cabe: number,
  encaja: number,
): readonly (readonly [number, number])[] {
  const pasos = 4;
  const formando = Array.from({ length: pasos }, (_, i): readonly [number, number] => [
    (encaja * i) / pasos,
    cubre * (cabe / cubre) ** (i / pasos),
  ]);
  return [...formando, [encaja, cabe], [encaja + (1 - encaja) * 0.5, cabe * 0.3], [1, 0]];
}
