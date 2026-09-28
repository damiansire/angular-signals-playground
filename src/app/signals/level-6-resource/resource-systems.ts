import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 6: datos que llegan de afuera y tardan. Es el primer punto del recorrido donde
 * el sistema deja de ser sincrónico, así que el error que se contrasta es el clásico de la carrera:
 * dos pedidos en vuelo y gana el que vuelve último, no el último que pediste.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 6/1 · resource cancela el pedido viejo; un fetch suelto en un effect no. */
export const RESOURCE_BASIC_SYSTEM: ManipulableChallenge = {
  knobs: knob('pedir con un fetch suelto o con resource'),
  gauges: [{ id: 'viejas', label: 'respuestas viejas' }],
  action: 'buscar otra cosa',
  start: { viejas: 0 },
  code: (k) =>
    k[K] === 1
      ? [
          { text: 'const user = resource({', knob: K },
          { text: '  params: () => ({ id: id() }),' },
          { text: '  loader: ({ params }) => traer(params.id),' },
          { text: '});' },
        ]
      : [
          { text: 'effect(() => {', knob: K },
          { text: '  traer(id()).then((u) => user.set(u));' },
          { text: '});' },
        ],
  // Sin cancelación, la respuesta de la búsqueda anterior pisa a la nueva cuando llega tarde.
  settle: (s: SystemState) => ({ viejas: s.knobs[K] === 1 ? 0 : Math.max(0, s.actions - 1) }),
  healthy: (s: SystemState) => s.actions >= 2 && s.values['viejas'] === 0,
};

/** 6/2 · rxResource es lo mismo cuando el loader ya es un Observable. */
export const RX_RESOURCE_SYSTEM: ManipulableChallenge = {
  knobs: knob('suscribirse a mano o dejar que rxResource lo maneje'),
  gauges: [{ id: 'vivas', label: 'suscripciones vivas' }],
  action: 'cambiar el filtro',
  start: { vivas: 0 },
  code: (k) =>
    k[K] === 1
      ? [
          { text: 'const lista = rxResource({', knob: K },
          { text: '  params: () => ({ q: filtro() }),' },
          { text: '  stream: ({ params }) => http.get(params.q),' },
          { text: '});' },
        ]
      : [
          { text: 'effect(() => {', knob: K },
          { text: '  http.get(filtro()).subscribe(set);' },
          { text: '});' },
        ],
  settle: (s: SystemState) => ({ vivas: s.knobs[K] === 1 ? Math.min(s.actions, 1) : s.actions }),
  healthy: (s: SystemState) => s.actions >= 2 && s.values['vivas'] === 1,
};

const LECTURA = 'lectura';

/** La tripulación del Apolo 11 es de tres: el #4 no existe y el servidor contesta 404. */
const TRIPULANTES = 4;
const FALTANTE = 4;
/** Arranca mostrando al #3 para que el primer pedido ya caiga en el 404. */
const DESDE = 3;

const pedidoTras = (acciones: number): number => ((DESDE - 1 + acciones) % TRIPULANTES) + 1;

/**
 * 6/3 · con un 404, `value()` no devuelve undefined: TIRA. Es el error que el propio tipo invita
 * a cometer: sin `defaultValue` el valor es `T | undefined`, y el reflejo es `?.`, que no llega a
 * correr porque la excepción sale antes. La posición del medio es la trampa que parece arreglo:
 * `defaultValue` cubre idle y loading, no el error. Lo que sí pregunta sin tirar es `hasValue()`,
 * que además angosta el tipo y deja leer `value()` sin `?.`.
 */
export const HTTP_RESOURCE_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: LECTURA, positions: 3, label: 'cambiar cómo se lee el valor' }],
  gauges: [
    { id: 'codigo', label: 'statusCode' },
    { id: 'excepciones', label: 'excepciones' },
  ],
  action: 'pedir el siguiente',
  start: { codigo: 200, excepciones: 0 },

  code: (k) => {
    const pedido = [
      { text: 'const t = httpResource<Tripulante>(' },
      { text: '  () => `datos/tripulacion/${id()}.json`,' },
    ];
    if (k[LECTURA] === 1) {
      return [
        ...pedido,
        { text: '  { defaultValue: NADIE },' },
        { text: ');' },
        { text: 'const nombre = computed(() => t.value().nombre);', knob: LECTURA },
      ];
    }
    if (k[LECTURA] === 2) {
      return [
        ...pedido,
        { text: ');' },
        {
          text: "const nombre = computed(() => t.hasValue() ? t.value().nombre : '');",
          knob: LECTURA,
        },
      ];
    }
    return [
      ...pedido,
      { text: ');' },
      { text: 'const nombre = computed(() => t.value()?.nombre);', knob: LECTURA },
    ];
  },

  // Cada vez que la corrida cae en el #4, leer `value()` tira, salvo que antes se pregunte.
  settle: (s: SystemState) => {
    let caidas = 0;
    for (let accion = 1; accion <= s.actions; accion++) {
      if (pedidoTras(accion) === FALTANTE) caidas++;
    }
    return {
      codigo: pedidoTras(s.actions) === FALTANTE ? 404 : 200,
      excepciones: s.knobs[LECTURA] === 2 ? 0 : caidas,
    };
  },

  // Sano es haber pasado por el 404 sin que la lectura tire: la primera acción ya cae ahí.
  healthy: (s: SystemState) => s.actions > 0 && s.values['excepciones'] === 0,
};
