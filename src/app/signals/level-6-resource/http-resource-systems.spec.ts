import { ApplicationRef, computed, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpResourceRef, httpResource, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  accionesParaSaber,
  act,
  healthOf,
  malformed,
  solutionFor,
  startOf,
  SystemState,
  turn,
} from '../../libs/manipulable-challenge';
import { HTTP_RESOURCE_SYSTEM } from './resource-systems';
import { Tripulante } from './sub-levels/3-http-resource/tripulacion';

describe('httpResource 6/3 · con un 404, value() tira', () => {
  const sistema = HTTP_RESOURCE_SYSTEM;
  const codigo = (posicion: number) =>
    sistema
      .code({ lectura: posicion })
      .map((line) => line.text)
      .join('\n');

  /** Una corrida limpia con la perilla en `posicion`, accionada `veces`. */
  function correr(posicion: number, veces: number): SystemState {
    let state = startOf(sistema);
    for (let i = 0; i < posicion; i++) state = turn(sistema, state, 'lectura');
    for (let i = 0; i < veces; i++) state = act(sistema, state);
    return state;
  }

  it('sigue bien armado', () => {
    expect(malformed(sistema)).toEqual([]);
  });

  it('es resoluble, y la primera acción ya alcanza para saber', () => {
    expect(solutionFor(sistema)).not.toBeNull();
    expect(accionesParaSaber(sistema)).toBe(1);
  });

  // En v22 httpResource solo acepta una función: la URL como string suelto ya no compila.
  it('en las tres posiciones la URL sale de una función reactiva, relativa', () => {
    for (const posicion of [0, 1, 2]) {
      expect(codigo(posicion)).toContain('() => `datos/tripulacion/${id()}.json`');
    }
  });

  it('la avería es el ?. que el tipo T | undefined invita a poner', () => {
    expect(codigo(0)).toContain('t.value()?.nombre');
    const state = correr(0, 1);
    expect(state.values).toEqual({ codigo: 404, excepciones: 1 });
    expect(healthOf(sistema, state)).toBe('broken');
  });

  it('defaultValue parece arreglo y no lo es: cubre idle y loading, no el error', () => {
    expect(codigo(1)).toContain('defaultValue');
    expect(codigo(1)).not.toContain('hasValue');
    const state = correr(1, 1);
    expect(state.values).toEqual({ codigo: 404, excepciones: 1 });
    expect(healthOf(sistema, state)).toBe('broken');
  });

  it('preguntar hasValue() antes de leer pasa por el 404 sin tirar', () => {
    expect(codigo(2)).toContain('t.hasValue() ? t.value().nombre');
    const state = correr(2, 1);
    expect(state.values).toEqual({ codigo: 404, excepciones: 0 });
    expect(healthOf(sistema, state)).toBe('healthy');
  });

  it('una vuelta entera de la tripulación vuelve a caer en el 404', () => {
    const codigos = [1, 2, 3, 4, 5].map((veces) => correr(0, veces).values['codigo']);
    expect(codigos).toEqual([404, 200, 200, 200, 404]);
    expect(correr(0, 5).values['excepciones']).toBe(2);
    expect(correr(2, 5).values['excepciones']).toBe(0);
  });

  it('antes de accionar muestra al #3 recién llegado, sin evidencia de nada', () => {
    const state = startOf(sistema);
    expect(state.values).toEqual({ codigo: 200, excepciones: 0 });
    expect(healthOf(sistema, state)).toBe('idle');
  });
});

/**
 * El settle de arriba es una maqueta. Esto la ata al API real: si una versión futura de Angular
 * cambiara lo que hace `value()` en error, el desafío estaría enseñando algo falso y tiene que
 * romper acá, no en la cabeza de quien lo juega.
 */
describe('httpResource de verdad, contra un 404', () => {
  const URL_FALTANTE = 'datos/tripulacion/4.json';
  const NADIE: Tripulante = { nombre: '', rol: '' };
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function crear<T>(nuevo: () => HttpResourceRef<T>): HttpResourceRef<T> {
    const tripulante = TestBed.runInInjectionContext(nuevo);
    TestBed.tick();
    return tripulante;
  }

  /** Le contesta 404 al pedido en vuelo y espera a que el resource termine de asentarse. */
  async function contestarQueNoExiste(): Promise<void> {
    http.expectOne(URL_FALTANTE).flush(null, { status: 404, statusText: 'Not Found' });
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('value() tira, y el ?. no llega a correr', async () => {
    const t = crear(() => httpResource<Tripulante>(() => URL_FALTANTE));
    const nombre = computed(() => t.value()?.nombre);
    await contestarQueNoExiste();
    expect(t.status()).toBe('error');
    expect(() => nombre()).toThrow();
  });

  it('defaultValue cubre la espera, pero con el 404 value() tira igual', async () => {
    const t = crear(() => httpResource<Tripulante>(() => URL_FALTANTE, { defaultValue: NADIE }));
    expect(t.value()).toBe(NADIE);
    await contestarQueNoExiste();
    expect(t.status()).toBe('error');
    expect(() => t.value().nombre).toThrow();
  });

  it('hasValue() contesta false sin tirar, y statusCode dice 404', async () => {
    const t = crear(() => httpResource<Tripulante>(() => URL_FALTANTE));
    const nombre = computed(() => (t.hasValue() ? t.value().nombre : ''));
    await contestarQueNoExiste();
    expect(nombre()).toBe('');
    expect(t.statusCode()).toBe(404);
  });
});
