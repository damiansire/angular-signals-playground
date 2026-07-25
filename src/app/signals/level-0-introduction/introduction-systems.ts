import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas del nivel 0. Acá todavía no hay API que aprender: el nivel arma el argumento de por qué
 * hacen falta los signals. Los desafíos siguen esa cadena, así que la perilla no es una opción de
 * la librería sino una decisión sobre el DOM y sobre quién avisa.
 */

const K = 'perilla';
const knob = (label: string, positions = 2) => [{ id: K, positions, label }];

/** 0/1 · el HTML anidado se convierte en un árbol de padres e hijos. */
export const HTML_TREE_SYSTEM: ManipulableChallenge = {
  knobs: knob('sacar el párrafo de adentro de la sección o volver a meterlo'),
  gauges: [{ id: 'hijos', label: 'hijos' }],
  action: 'parsear',
  start: { hijos: 0 },
  code: (k) =>
    k[K] === 1
      ? [
          { text: '<section>' },
          { text: '  <h2>Hola</h2>' },
          { text: '  <p>Texto</p>', knob: K },
          { text: '</section>' },
        ]
      : [
          { text: '<section>' },
          { text: '  <h2>Hola</h2>' },
          { text: '</section>' },
          { text: '<p>Texto</p>', knob: K },
        ],
  settle: (s: SystemState) => ({ hijos: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 2 : 1 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['hijos'] === 2,
  establishes: 'El HTML anidado se convierte en un árbol de nodos padre e hijo.',
};

/** 0/2 · cambiar la pantalla es encontrar un nodo y mutarlo. */
export const DOM_ALIVE_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar el selector con el que buscás el nodo'),
  gauges: [{ id: 'tocados', label: 'nodos tocados' }],
  action: 'correr la línea',
  start: { tocados: 0 },
  code: (k) => [
    { text: "// el título es <h2 class='titulo'>" },
    k[K] === 1
      ? { text: "document.querySelector('.titulo')", knob: K }
      : { text: "document.querySelector('#titulo')", knob: K },
    { text: "  .textContent = 'Nuevo';" },
  ],
  // Un selector que no matchea devuelve null: la línea corre y no toca nada.
  settle: (s: SystemState) => ({ tocados: s.knobs[K] === 1 ? s.actions : 0 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['tocados'] === s.actions,
  establishes: 'Cambiar la pantalla es encontrar un nodo del árbol y mutarlo.',
};

/** 0/3 · no todo cambio cuesta lo mismo: el flujo saltea las etapas que no hacen falta. */
export const DOM_PIXEL_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar qué propiedad animás', 3),
  gauges: [{ id: 'etapas', label: 'etapas' }],
  action: 'animar',
  start: { etapas: 0 },
  code: (k) => [
    { text: 'el.animate(' },
    k[K] === 2
      ? { text: "  { transform: 'translateX(80px)' },", knob: K }
      : k[K] === 1
        ? { text: "  { color: 'crimson' },", knob: K }
        : { text: "  { width: '320px' },", knob: K },
    { text: '  300,' },
    { text: ');' },
  ],
  // width rehace geometría (5), color repinta (4), transform solo compone (2).
  settle: (s: SystemState) => ({
    etapas: s.actions === 0 ? 0 : s.knobs[K] === 2 ? 2 : s.knobs[K] === 1 ? 4 : 5,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['etapas'] === 2,
  establishes: 'Animar transform saltea layout y paint: solo compone.',
};

/** 0/4 · con la sincronización a mano, siempre te olvidás un lugar. */
export const MANUAL_SYNC_SYSTEM: ManipulableChallenge = {
  knobs: knob('completar o dejar incompleto el handler'),
  gauges: [{ id: 'viejas', label: 'vistas viejas' }],
  action: 'incrementar',
  start: { viejas: 0 },
  code: (k) => [
    { text: 'function increment() {' },
    { text: '  count++;' },
    { text: '  badge.textContent = count;' },
    k[K] === 1
      ? { text: '  total.textContent = count;', knob: K }
      : { text: '  // falta actualizar total', knob: K },
    { text: '}' },
  ],
  settle: (s: SystemState) => ({ viejas: s.actions === 0 || s.knobs[K] === 1 ? 0 : 1 }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['viejas'] === 0,
  establishes: 'Sincronizar a mano se rompe en cuanto te olvidás un lugar.',
};

/** 0/5 · Zone.js solo se entera de lo que parchea. */
export const ZONE_PATCH_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar con qué API async cambiás el valor'),
  gauges: [{ id: 'pantalla', label: 'al día' }],
  action: 'cambiar el valor',
  start: { pantalla: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'setTimeout(() => {', knob: K }
      : { text: 'requestIdleCallback(() => {', knob: K },
    { text: '  this.total = 42;' },
    { text: '});' },
  ],
  // Sin parche, Angular nunca se entera de que pasó algo.
  settle: (s: SystemState) => ({ pantalla: s.actions > 0 && s.knobs[K] === 1 ? 1 : 0 }),
  healthy: (s: SystemState) => s.values['pantalla'] === 1,
  establishes: 'Zone.js solo se entera de las APIs async que alcanza a parchear.',
};

/** 0/6 · el signal avisa QUIÉN lo lee, así que se re-chequea solo eso. */
export const SIGNAL_NOTIFY_SYSTEM: ManipulableChallenge = {
  knobs: knob('cambiar cómo se entera Angular'),
  gauges: [{ id: 'revisados', label: 'nodos revisados' }],
  action: 'cambiar el valor',
  start: { revisados: 0 },
  code: (k) => [
    k[K] === 1
      ? { text: 'const total = signal(0);', knob: K }
      : { text: 'let total = 0; // Zone.js avisa', knob: K },
    { text: '' },
    { text: 'total.set(42);' },
  ],
  // Zone.js no sabe QUÉ cambió, así que barre el árbol; el signal apunta a sus lectores.
  settle: (s: SystemState) => ({
    revisados: s.actions === 0 ? 0 : s.knobs[K] === 1 ? 2 : 7,
  }),
  healthy: (s: SystemState) => s.actions > 0 && s.values['revisados'] === 2,
  establishes: 'El signal avisa quién lo lee, así que se re-chequea solo eso.',
};
