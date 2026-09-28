import {
  act,
  healthOf,
  malformed,
  solutionFor,
  startOf,
  SystemState,
  turn,
} from '../../libs/manipulable-challenge';
import { DEBOUNCED_NATIVE_SYSTEM } from './debounce-systems';

describe('debounce 10/3 · debounced() nativo: crearlo no alcanza, hay que leerlo', () => {
  const sistema = DEBOUNCED_NATIVE_SYSTEM;

  function teclas(n: number, desde: SystemState): SystemState {
    let state = desde;
    for (let i = 0; i < n; i++) state = act(sistema, state);
    return state;
  }

  const leyendoElDebounced = () => turn(sistema, startOf(sistema), 'perilla');

  it('está bien armado en las dos posiciones de la perilla', () => {
    expect(malformed(sistema)).toEqual([]);
  });

  it('tiene solución', () => {
    expect(solutionFor(sistema)).not.toBeNull();
  });

  it('arranca leyendo la consulta cruda aunque el debounced ya esté creado', () => {
    const codigo = sistema.code(startOf(sistema).knobs).map((line) => line.text);
    expect(codigo).toContain('const q = debounced(consulta, 300);');
    expect(codigo).toContain('  params: () => consulta(),');
  });

  it('leyendo la fuente cruda sale una búsqueda por tecla', () => {
    const state = teclas(4, startOf(sistema));
    expect(state.values['busquedas']).toBe(4);
    expect(healthOf(sistema, state)).toBe('broken');
  });

  it('leyendo .value() la ráfaga entera colapsa en una sola búsqueda', () => {
    const state = teclas(4, leyendoElDebounced());
    expect(state.values['busquedas']).toBe(1);
    expect(healthOf(sistema, state)).toBe('healthy');
  });

  it('una sola tecla no alcanza para distinguir los dos códigos', () => {
    expect(teclas(1, startOf(sistema)).values).toEqual(teclas(1, leyendoElDebounced()).values);
    expect(healthOf(sistema, teclas(1, leyendoElDebounced()))).toBe('idle');
  });

  it('girar al código sano arranca una corrida nueva: hay que volver a tipear', () => {
    const rota = teclas(3, startOf(sistema));
    const girada = turn(sistema, rota, 'perilla');
    expect(girada.actions).toBe(0);
    expect(girada.values['busquedas']).toBe(0);
    expect(healthOf(sistema, girada)).toBe('idle');
  });
});
