/**
 * Modelo del sub-nivel "el DOM está vivo": un puñado de nodos con su texto actual y
 * mutaciones canónicas de JS que tocan UN nodo. `applyMutation` es la operación atómica
 * (seleccionar un nodo y cambiarlo) que los signals después automatizan; se testea como
 * función pura, sin DOM real.
 */
export interface DomNodeState {
  id: string;
  selector: string;
  text: string;
}

export interface DomMutation {
  id: string;
  code: string;
  targetId: string;
  value: string;
}

export const INITIAL_DOM: readonly DomNodeState[] = [
  { id: 'count', selector: '#count', text: '0' },
  { id: 'status', selector: '#status', text: 'inactivo' },
  { id: 'title', selector: 'h1', text: 'Contador' },
];

export const MUTATIONS: readonly DomMutation[] = [
  {
    id: 'count',
    code: "document.querySelector('#count').textContent = '1'",
    targetId: 'count',
    value: '1',
  },
  {
    id: 'status',
    code: "document.querySelector('#status').textContent = 'activo'",
    targetId: 'status',
    value: 'activo',
  },
  {
    id: 'title',
    code: "document.querySelector('h1').textContent = 'Listo'",
    targetId: 'title',
    value: 'Listo',
  },
];

/** Devuelve un DOM nuevo con SOLO el nodo objetivo cambiado (inmutable). */
export function applyMutation(dom: readonly DomNodeState[], mutation: DomMutation): DomNodeState[] {
  return dom.map((node) =>
    node.id === mutation.targetId ? { ...node, text: mutation.value } : node,
  );
}
