import { ManipulableChallenge, SystemState } from '../libs/manipulable-challenge';

/**
 * El minijuego de "¡Activen todos los operadores de RxJS, rápido!": cada nave tiene un hueco en su
 * código y quien juega elige el operador que va ahí. Son los mismos desafíos de los conceptos (una
 * perilla que arranca rota, una lectura que contesta), así que valen sus reglas y su barrido.
 *
 * Los tres andan, y aun así no alcanza: la anomalía tira más rápido de lo que los operadores
 * corrigen. Por eso nada de esto decide si escapan; lo que enseña es qué hace cada operador.
 */

export interface HuecoDelPrologo {
  /** La nave que lo pide, en el orden de la flota del prólogo: capitán, Nave A, Nave B. */
  readonly nave: 0 | 1 | 2;
  /** Como la nombra la caja de diálogo del prólogo. */
  readonly nombre: string;
  readonly titulo: string;
  /** El operador que lo arregla: lo que la nave dispara cuando su código queda sano. */
  readonly operador: string;
  readonly sistema: ManipulableChallenge;
  /**
   * Qué es cada nombre del código, uno por renglón. Sin esto el hueco era adivinar: no se sabía
   * qué era `p`. En una sola frase con el encargo, los nombres se perdían en el párrafo.
   */
  readonly nombres: readonly { readonly codigo: string; readonly es: string }[];
  /** Qué tiene que salir, en una frase. El código va entre comillas invertidas. */
  readonly encargo: string;
  /**
   * La lectura sana, sin el nombre de la lectura: va al lado del número que da el código, bajo su
   * mismo rótulo, así se comparan sin leer.
   */
  readonly meta: string;
  /**
   * Quien ayuda es OTRA nave: Angie todavía no puede intervenir (docs/historia), pero la
   * tripulación sí se habla. Dice qué hizo el operador equivocado, nunca cuál es el bueno.
   */
  readonly ayuda: { readonly nave: 0 | 1 | 2; readonly nombre: string };
  /** Qué hace cada operador roto, por nombre. El sano no tiene entrada: acertar es en silencio. */
  readonly pistas: Readonly<Record<string, string>>;
}

const K = 'hueco';
const hueco = (label: string) => [{ id: K, positions: 3, label }];
/** El renglón del hueco: la perilla elige el operador y el resto del renglón no cambia. */
const opcion = (operadores: readonly string[], k: number, resto: string) => ({
  text: `  ${operadores[k]}${resto}`,
  knob: K,
});

/**
 * Los tres huecos se arreglan con los operadores más simples, `map`, `tap` y `filter`, y siempre se
 * elige entre esos tres: el prólogo es antes de aprender nada, y con `scan` o `throttleTime` el
 * hueco era adivinar un nombre. Cada uno pide exactamente lo que hace uno solo de los tres.
 */

/** Lo que entra en cada lectura: crece de a 10 para que se vea que el motor recibe el doble. */
const PASO = 10;
const DOBLE = ['tap', 'filter', 'map'] as const;

/**
 * Duplicar la velocidad: `map` manda al motor lo que devuelve la cuenta. `tap` hace la cuenta y la
 * tira, y `filter` la usa para decidir si pasa (pasa, pero igual que entró): con los dos, al motor
 * llega lo mismo que entra.
 */
export const DOBLE_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que duplica la velocidad'),
  gauges: [
    { id: 'entra', label: 'entra' },
    { id: 'motor', label: 'al motor' },
  ],
  action: 'leer la velocidad',
  start: { entra: 0, motor: 0 },
  code: (k) => [
    { text: 'const turbo$ = velocidad$.pipe(' },
    opcion(DOBLE, k[K], '((v) => v * 2),'),
    { text: ');' },
    { text: 'motor.acelerar(turbo$);' },
  ],
  settle: (s: SystemState) => {
    const entra = PASO * s.actions;
    return { entra, motor: DOBLE[s.knobs[K]] === 'map' ? entra * 2 : entra };
  },
  healthy: (s: SystemState) => s.actions >= 1 && s.values['motor'] === 2 * s.values['entra'],
};

const MIRAR = ['map', 'filter', 'tap'] as const;

/**
 * Ver la velocidad sin tocarla: `tap` la muestra en el panel y la deja pasar igual. Con `map` al
 * motor llega lo que devuelve `mostrar`, que no devuelve nada, y con `filter` ese "nada" cuenta como
 * falso y no pasa ninguna: el panel la muestra, pero el motor se queda sin velocidad.
 */
export const MIRAR_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que muestra la velocidad'),
  gauges: [
    { id: 'panel', label: 'panel' },
    { id: 'motor', label: 'al motor' },
  ],
  action: 'leer la velocidad',
  start: { panel: 0, motor: 0 },
  code: (k) => [
    { text: 'const vista$ = velocidad$.pipe(' },
    opcion(MIRAR, k[K], '((v) => panel.mostrar(v)),'),
    { text: ');' },
    { text: 'motor.acelerar(vista$);' },
  ],
  settle: (s: SystemState) => {
    const v = PASO * s.actions;
    return { panel: v, motor: MIRAR[s.knobs[K]] === 'tap' ? v : 0 };
  },
  healthy: (s: SystemState) =>
    s.actions >= 1 && s.values['motor'] === s.values['panel'] && s.values['panel'] > 0,
};

/** Cada carga trae combustible, agua y combustible: dos que sirven y una que hay que sacar. */
const COMBUSTIBLE_POR_CARGA = 2;
const AGUA_POR_CARGA = 1;
const LIMPIAR = ['tap', 'map', 'filter'] as const;

/**
 * Sacar el agua del combustible: `filter` deja pasar solo lo que es combustible. `tap` mira y deja
 * pasar todo, agua incluida, y `map` cambia cada carga por la respuesta de la pregunta: al motor
 * llegan `true` y `false`, que no son combustible.
 */
export const AGUA_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que saca el agua'),
  gauges: [
    { id: 'combustible', label: 'combustible' },
    { id: 'agua', label: 'agua' },
  ],
  action: 'cargar el tanque',
  start: { combustible: 0, agua: 0 },
  code: (k) => [
    { text: 'const limpio$ = carga$.pipe(' },
    opcion(LIMPIAR, k[K], "((c) => c === 'combustible'),"),
    { text: ');' },
    { text: 'motor.cargar(limpio$);' },
  ],
  settle: (s: SystemState) => {
    const operador = LIMPIAR[s.knobs[K]];
    if (operador === 'map') return { combustible: 0, agua: 0 };
    return {
      combustible: COMBUSTIBLE_POR_CARGA * s.actions,
      agua: operador === 'tap' ? AGUA_POR_CARGA * s.actions : 0,
    };
  },
  healthy: (s: SystemState) =>
    s.actions >= 1 && s.values['agua'] === 0 && s.values['combustible'] === COMBUSTIBLE_POR_CARGA * s.actions,
};

/** En el orden en que se juegan, que es el de la flota: primero el capitán. */
export const HUECOS_DEL_PROLOGO: readonly HuecoDelPrologo[] = [
  {
    nave: 0,
    nombre: 'Capitán',
    titulo: 'Duplicar la velocidad',
    operador: 'map',
    sistema: DOBLE_SYSTEM,
    nombres: [
      { codigo: 'v', es: 'la velocidad que entra' },
      { codigo: 'v * 2', es: 'el doble' },
    ],
    encargo: 'Al motor tiene que llegar `v * 2`.',
    meta: 'el doble',
    ayuda: { nave: 1, nombre: 'Nave A' },
    pistas: {
      tap: '`tap` hace la cuenta y la tira. Al motor llega la misma velocidad.',
      filter: '`filter` usa la cuenta para decidir si pasa. Pasa, pero igual que entró.',
    },
  },
  {
    nave: 1,
    nombre: 'Nave A',
    titulo: 'Ver la velocidad',
    operador: 'tap',
    sistema: MIRAR_SYSTEM,
    nombres: [{ codigo: 'panel.mostrar(v)', es: 'la pone en el panel, y no devuelve nada' }],
    encargo: 'El panel la muestra y el motor la recibe igual.',
    meta: 'los dos iguales',
    ayuda: { nave: 2, nombre: 'Nave B' },
    pistas: {
      map: '`map` manda al motor lo que devuelve `mostrar`, y no devuelve nada.',
      filter: '`filter` deja pasar si `mostrar` da verdadero, y no da nada: no pasa ninguna.',
    },
  },
  {
    nave: 2,
    nombre: 'Nave B',
    titulo: 'Sacar el agua',
    operador: 'filter',
    sistema: AGUA_SYSTEM,
    nombres: [
      { codigo: 'c', es: 'lo que trae la carga: combustible o agua' },
      { codigo: "c === 'combustible'", es: 'verdadero si es combustible' },
    ],
    encargo: 'Al motor tiene que llegar solo combustible.',
    meta: 'agua 0',
    ayuda: { nave: 0, nombre: 'Capitán' },
    pistas: {
      tap: '`tap` mira la carga y la deja pasar entera, con agua y todo.',
      map: '`map` cambia cada carga por la respuesta: al motor llegan `true` y `false`.',
    },
  },
];
