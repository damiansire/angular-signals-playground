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
}

const K = 'hueco';
const hueco = (label: string) => [{ id: K, positions: 3, label }];
/** El renglón del hueco: la perilla elige el operador y el resto del renglón no cambia. */
const opcion = (operadores: readonly string[], k: number, resto: string) => ({
  text: `  ${operadores[k]}${resto}`,
  knob: K,
});

/** Cuánto corre el rumbo cada lectura que llega sin corregir. */
const DERIVA = 12;
const RUMBO = ['filter', 'tap', 'map'] as const;

/**
 * El rumbo: cada lectura del sensor llega corrida por la deriva y hay que restársela. `filter` usa
 * la cuenta para decidir si deja pasar la lectura, y `tap` la hace y la tira: las dos dejan pasar la
 * lectura sin corregir. Solo `map` manda la lectura corregida.
 */
export const RUMBO_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que corrige cada lectura'),
  gauges: [{ id: 'desvio', label: 'desvío' }],
  action: 'leer el sensor',
  start: { desvio: 0 },
  code: (k) => [
    { text: 'const rumbo$ = lecturas$.pipe(' },
    opcion(RUMBO, k[K], '((p) => p - deriva),'),
    { text: ');' },
    { text: 'nave.girar(rumbo$);' },
  ],
  settle: (s: SystemState) => ({
    desvio: RUMBO[s.knobs[K]] === 'map' ? 0 : DERIVA * s.actions,
  }),
  healthy: (s: SystemState) => s.actions >= 1 && s.values['desvio'] === 0,
};

/** Lo que suma cada encendido del motor. */
const EMPUJE = 10;
const VELOCIDAD = ['reduce', 'map', 'scan'] as const;

/**
 * La velocidad: cada encendido del motor suma empuje. `reduce` acumula bien pero emite recién
 * cuando el flujo termina, y el motor no termina nunca. `map` no acumula: su segundo argumento es
 * el índice, así que da el empuje más el número de encendido. Solo `scan` emite la suma en cada
 * paso.
 */
export const EMPUJE_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que acumula el empuje'),
  gauges: [{ id: 'velocidad', label: 'velocidad' }],
  action: 'encender el motor',
  start: { velocidad: 0 },
  code: (k) => [
    { text: 'const velocidad$ = empuje$.pipe(' },
    opcion(VELOCIDAD, k[K], '((vel, e) => vel + e, 0),'),
    { text: ');' },
    { text: 'motor.acelerar(velocidad$);' },
  ],
  settle: (s: SystemState) => {
    const operador = VELOCIDAD[s.knobs[K]];
    if (operador === 'scan') return { velocidad: EMPUJE * s.actions };
    if (operador === 'map') return { velocidad: s.actions ? EMPUJE + s.actions - 1 : 0 };
    return { velocidad: 0 };
  },
  // Con un solo encendido `map` también da 10: hacen falta dos para ver que no acumula.
  healthy: (s: SystemState) => s.actions >= 2 && s.values['velocidad'] === EMPUJE * s.actions,
};

/** Correcciones que caben en una ráfaga: dura 300 ms y se corrige una vez cada 100. */
const POR_RAFAGA = 3;
const SENSORES = ['debounceTime', 'bufferTime', 'throttleTime'] as const;

/**
 * Los sensores: adentro del tirón llegan lecturas cada 10 ms y no paran. `debounceTime` espera un
 * silencio que nunca llega, así que no corrige nada. `bufferTime` junta las lecturas en listas y
 * `corregir` espera un número: ninguna corrección sirve. Solo `throttleTime` deja pasar una lectura
 * cada 100 ms y descarta el resto.
 */
export const SENSORES_SYSTEM: ManipulableChallenge = {
  knobs: hueco('el operador que raciona las lecturas'),
  gauges: [{ id: 'correcciones', label: 'correcciones' }],
  action: 'recibir una ráfaga',
  start: { correcciones: 0 },
  code: (k) => [
    { text: 'sensores$.pipe(' },
    opcion(SENSORES, k[K], '(100),'),
    { text: '  map(corregir),' },
    { text: ').subscribe(nave.estabilizar);' },
  ],
  settle: (s: SystemState) => ({
    correcciones: SENSORES[s.knobs[K]] === 'throttleTime' ? POR_RAFAGA * s.actions : 0,
  }),
  healthy: (s: SystemState) =>
    s.actions >= 1 && s.values['correcciones'] === POR_RAFAGA * s.actions,
};

/** En el orden en que se juegan, que es el de la flota: primero el capitán. */
export const HUECOS_DEL_PROLOGO: readonly HuecoDelPrologo[] = [
  {
    nave: 0,
    nombre: 'Capitán',
    titulo: 'Corregir el rumbo',
    operador: 'map',
    sistema: RUMBO_SYSTEM,
  },
  {
    nave: 1,
    nombre: 'Nave A',
    titulo: 'Acumular el empuje',
    operador: 'scan',
    sistema: EMPUJE_SYSTEM,
  },
  {
    nave: 2,
    nombre: 'Nave B',
    titulo: 'Sensores saturados',
    operador: 'throttleTime',
    sistema: SENSORES_SYSTEM,
  },
];
