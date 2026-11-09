import {
  INITIAL_DOM,
  SELECTORES_DEL_TITULO,
  type DomNodeState,
  algunaFallo,
  applyMutation,
  codigoDe,
  correr,
  encontrar,
  lineas,
  siguienteSelector,
} from './dom-is-alive.data';

describe('dom-is-alive (dominio "el DOM está vivo")', () => {
  const texto = (dom: readonly DomNodeState[], id: string) => dom.find((n) => n.id === id)!.text;
  const [ROTO, BIEN] = SELECTORES_DEL_TITULO;

  it('querySelector encuentra el nodo por su selector, o devuelve null', () => {
    expect(encontrar(INITIAL_DOM, 'h1')?.id).toBe('title');
    expect(encontrar(INITIAL_DOM, '#count')?.id).toBe('count');
    expect(encontrar(INITIAL_DOM, '#titulo')).toBeNull();
  });

  it('una línea cambia solo el nodo que encuentra, sin tocar el DOM de antes', () => {
    const [count] = lineas(BIEN);
    const next = applyMutation(INITIAL_DOM, count);
    expect(texto(next, 'count')).toBe('1');
    expect(texto(next, 'status')).toBe('inactivo');
    expect(texto(INITIAL_DOM, 'count')).toBe('0');
  });

  it('una línea que no encuentra nada deja el DOM como estaba', () => {
    const titulo = lineas(ROTO)[2];
    expect(applyMutation(INITIAL_DOM, titulo)).toBe(INITIAL_DOM);
  });

  it('con el selector roto, dos líneas llegan y la del título no', () => {
    const corrida = correr(INITIAL_DOM, lineas(ROTO));
    expect(corrida.envios.map((e) => e.destino)).toEqual(['count', 'status', null]);
    expect(texto(corrida.dom, 'title')).toBe('Contador');
    expect(algunaFallo(corrida)).toBeTrue();
  });

  it('con h1, las tres llegan y el título cambia', () => {
    const corrida = correr(INITIAL_DOM, lineas(BIEN));
    expect(corrida.envios.map((e) => e.destino)).toEqual(['count', 'status', 'title']);
    expect(texto(corrida.dom, 'title')).toBe('Listo');
    expect(algunaFallo(corrida)).toBeFalse();
  });

  it('solo h1 encuentra el título: los otros selectores de la rueda fallan', () => {
    for (const sel of SELECTORES_DEL_TITULO) {
      expect(encontrar(INITIAL_DOM, sel) !== null)
        .withContext(sel)
        .toBe(sel === 'h1');
    }
  });

  it('el renglón muestra el selector con que busca', () => {
    expect(codigoDe(lineas(ROTO)[2])).toBe("querySelector('#titulo').textContent = 'Listo'");
  });

  it('el hueco rota por todos los selectores y vuelve al primero', () => {
    expect(siguienteSelector(ROTO)).toBe(BIEN);
    const vuelta = SELECTORES_DEL_TITULO.reduce((s) => siguienteSelector(s), ROTO);
    expect(vuelta).toBe(ROTO);
  });
});
