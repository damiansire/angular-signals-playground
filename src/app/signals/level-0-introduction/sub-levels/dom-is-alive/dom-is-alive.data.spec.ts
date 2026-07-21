import { applyMutation, INITIAL_DOM, MUTATIONS, DomNodeState } from './dom-is-alive.data';

describe('dom-is-alive (dominio "el DOM está vivo")', () => {
  const byId = (dom: readonly DomNodeState[], id: string) => dom.find((n) => n.id === id)!;

  it('cambia solo el nodo objetivo', () => {
    const mutation = MUTATIONS.find((m) => m.targetId === 'count')!;
    const next = applyMutation(INITIAL_DOM, mutation);
    expect(byId(next, 'count').text).toBe('1');
    expect(byId(next, 'status').text).toBe('inactivo');
    expect(byId(next, 'title').text).toBe('Contador');
  });

  it('no muta el estado original (devuelve uno nuevo)', () => {
    const mutation = MUTATIONS.find((m) => m.targetId === 'status')!;
    const next = applyMutation(INITIAL_DOM, mutation);
    expect(next).not.toBe(INITIAL_DOM);
    expect(byId(INITIAL_DOM, 'status').text).toBe('inactivo');
    expect(byId(next, 'status').text).toBe('activo');
  });

  it('cada mutación apunta a un nodo que existe en el DOM', () => {
    for (const mutation of MUTATIONS) {
      expect(INITIAL_DOM.some((n) => n.id === mutation.targetId)).toBe(true);
    }
  });
});
