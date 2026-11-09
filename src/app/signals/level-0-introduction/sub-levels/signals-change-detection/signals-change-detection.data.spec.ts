import {
  ARBOL_INICIAL,
  DECLARACIONES,
  barrioTodo,
  correr,
  siguienteDeclaracion,
} from './signals-change-detection.data';

const [VARIABLE, SIGNAL] = DECLARACIONES;

describe('signals-change-detection (dominio "el signal avisa quién lo lee")', () => {
  it('arranca con la variable común, y la otra es el signal', () => {
    expect(VARIABLE.esSignal).toBeFalse();
    expect(SIGNAL.esSignal).toBeTrue();
  });

  // La avería tiene que ser código que alguien escribiría: con `let`, un number no tiene .update.
  it('la escritura sigue a la declaración', () => {
    expect(VARIABLE.renglon).toBe('let total = 0;');
    expect(VARIABLE.escritura).not.toContain('.update(');
    expect(SIGNAL.renglon).toContain('signal(0)');
    expect(SIGNAL.escritura).toContain('total.update(');
  });

  it('con la variable común, el valor sube y se revisa el árbol entero', () => {
    const estado = correr(ARBOL_INICIAL, VARIABLE);
    expect(estado.total).toBe(1);
    expect(estado.revisados.length).toBe(7);
    expect(barrioTodo(estado)).toBeTrue();
  });

  it('con el signal, se revisan solo los dos <p> que lo leen', () => {
    const estado = correr(correr(ARBOL_INICIAL, VARIABLE), SIGNAL);
    expect(estado.total).toBe(2);
    expect(estado.revisados).toEqual(['p', 'p2']);
    expect(barrioTodo(estado)).toBeFalse();
  });

  it('al inicio no se revisó nada', () => {
    expect(barrioTodo(ARBOL_INICIAL)).toBeFalse();
  });

  it('el hueco alterna entre las dos y vuelve a la primera', () => {
    expect(siguienteDeclaracion(VARIABLE)).toBe(SIGNAL);
    expect(siguienteDeclaracion(SIGNAL)).toBe(VARIABLE);
  });
});
