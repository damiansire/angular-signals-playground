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
  establishes: 'resource ata el pedido a sus params y descarta la respuesta que quedó vieja.',
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
  establishes: 'rxResource se encarga de la suscripción y de cerrarla al cambiar los params.',
};
