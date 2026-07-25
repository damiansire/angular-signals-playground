import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 5: estado editable que igual sigue a una fuente. El contraste es contra las
 * dos salidas fáciles y equivocadas, un `signal` suelto que queda viejo, y un `computed` que no
 * te deja tocar nada.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 5/1 · un signal suelto no se entera de que su fuente cambió. */
export const LINKED_BASIC_SYSTEM: ManipulableChallenge = {
  knobs: knob('atar el estado a la fuente o dejarlo suelto'),
  gauges: [{ id: 'invalidas', label: 'selecciones inválidas' }],
  action: 'cambiar de categoría',
  start: { invalidas: 0 },
  code: (k) => [
    { text: 'const categoria = signal("bebidas");' },
    { text: '' },
    k[K] === 1
      ? { text: 'const elegido = linkedSignal(() => primero(categoria()));', knob: K }
      : { text: 'const elegido = signal(primero(categoria()));', knob: K },
  ],
  // El signal suelto se inicializa una vez y queda apuntando a un item de la categoría vieja.
  settle: (s: SystemState) => ({ invalidas: s.actions > 0 && s.knobs[K] !== 1 ? s.actions : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['invalidas'] === 0,
  establishes: 'linkedSignal es estado editable que se reinicia cuando cambia su fuente.',
};

/** 5/2 · con source y computation, lo que sigue siendo válido se conserva. */
export const LINKED_SOURCE_SYSTEM: ManipulableChallenge = {
  knobs: knob('descartar siempre o conservar lo que sigue valiendo'),
  gauges: [{ id: 'perdidas', label: 'selecciones perdidas' }],
  action: 'recargar la lista',
  start: { perdidas: 0 },
  code: (k) => [
    { text: 'const elegido = linkedSignal({' },
    { text: '  source: items,' },
    k[K] === 1
      ? { text: '  computation: (l, p) => l.includes(p?.value) ? p.value : l[0],', knob: K }
      : { text: '  computation: (l) => l[0],', knob: K },
    { text: '});' },
  ],
  settle: (s: SystemState) => ({ perdidas: s.knobs[K] === 1 ? 0 : s.actions }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['perdidas'] === 0,
  establishes: 'Con source y computation, la elección se conserva si sigue siendo válida.',
};
