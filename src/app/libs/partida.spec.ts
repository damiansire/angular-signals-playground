import {
  CLAVE_PARTIDA,
  cargarPartida,
  conCinematica,
  conEstablecido,
  conPrologo,
  conPunto,
  conceptosEstablecidos,
  escribirPartida,
  guardarPartida,
  leerPartida,
  PARTIDA_VACIA,
  subsEstablecidos,
  type Punto,
} from './partida';

/** La forma real del recorrido: 11 conceptos con su cantidad de sub-niveles. */
const SUBS = [7, 3, 3, 2, 2, 2, 3, 4, 2, 2, 1];

describe('partida', () => {
  it('ida y vuelta: lo que se escribe se lee igual', () => {
    let p = conEstablecido(PARTIDA_VACIA, 3, 1);
    p = conEstablecido(p, 0, 0);
    p = conCinematica(p, 12);
    p = conPrologo(p);
    const leida = leerPartida(escribirPartida(p), SUBS);
    expect(leida).toEqual({
      establecidos: ['0/0', '3/1'],
      cinematicas: [12],
      prologo: true,
      punto: null,
    });
  });

  it('sin nada guardado arranca vacía', () => {
    expect(leerPartida(null, SUBS)).toEqual(PARTIDA_VACIA);
    expect(leerPartida('', SUBS)).toEqual(PARTIDA_VACIA);
  });

  it('un JSON roto o de otra forma no rompe: arranca vacía', () => {
    expect(leerPartida('{no es json', SUBS)).toEqual(PARTIDA_VACIA);
    expect(leerPartida('[1,2,3]', SUBS)).toEqual(PARTIDA_VACIA);
    expect(leerPartida('"hola"', SUBS)).toEqual(PARTIDA_VACIA);
  });

  it('una versión que no es la actual arranca de cero en vez de interpretarse mal', () => {
    const vieja = JSON.stringify({ v: 0, establecidos: ['1/1'], cinematicas: [], prologo: true });
    expect(leerPartida(vieja, SUBS)).toEqual(PARTIDA_VACIA);
  });

  it('una partida de la versión 1 se traduce: la Introducción entera pasó a la historia', () => {
    const v1 = JSON.stringify({
      v: 1,
      establecidos: ['0/0', '0/2', '0/4', '0/5', '1/3', '11/0'],
      cinematicas: [0, 1],
      prologo: true,
    });
    expect(leerPartida(v1, SUBS)).toEqual({
      establecidos: ['0/3', '10/0'],
      cinematicas: [1],
      prologo: true,
      punto: null,
    });
  });

  it('una partida de la versión 2 corre todo un concepto: el árbol de 0/0 ahora es de la historia', () => {
    const v2 = JSON.stringify({
      v: 2,
      establecidos: ['0/0', '1/3', '4/1', '11/0'],
      cinematicas: [0, 1, 12],
      prologo: true,
      punto: { lugar: 'recorrido', concepto: 4, sub: 1 },
    });
    expect(leerPartida(v2, SUBS)).toEqual({
      establecidos: ['0/3', '3/1', '10/0'],
      cinematicas: [1, 12],
      prologo: true,
      punto: { lugar: 'recorrido', concepto: 3, sub: 1 },
    });
    const enLaIntro = JSON.stringify({
      v: 2,
      establecidos: [],
      cinematicas: [],
      punto: { lugar: 'recorrido', concepto: 0, sub: -1 },
    });
    expect(leerPartida(enLaIntro, SUBS).punto).toBeNull();
    const enElPrologo = JSON.stringify({
      v: 2,
      establecidos: [],
      cinematicas: [],
      punto: { lugar: 'prologo', linea: 'voz-supongo' },
    });
    expect(leerPartida(enElPrologo, SUBS).punto).toEqual({
      lugar: 'prologo',
      linea: 'voz-supongo',
    });
  });

  it('lo que se escribe hoy lleva la versión 3', () => {
    expect(JSON.parse(escribirPartida(PARTIDA_VACIA)).v).toBe(3);
  });

  it('descarta ids que ya no existen en el recorrido y los que no tienen forma de id', () => {
    const crudo = JSON.stringify({
      v: 3,
      establecidos: ['10/0', '10/1', '11/0', '2/9', 'x/y', 7, '3/1', '3/1'],
      cinematicas: [0, 1, 12, 13, -1, 2.5, 'tres'],
      prologo: 'si',
    });
    expect(leerPartida(crudo, SUBS)).toEqual({
      establecidos: ['3/1', '10/0'],
      cinematicas: [1, 12],
      prologo: false,
      punto: null,
    });
  });

  it('agregar dos veces lo mismo no duplica ni cambia la referencia', () => {
    const una = conEstablecido(PARTIDA_VACIA, 2, 0);
    expect(conEstablecido(una, 2, 0)).toBe(una);
    const vista = conCinematica(PARTIDA_VACIA, 4);
    expect(conCinematica(vista, 4)).toBe(vista);
    const conP = conPrologo(PARTIDA_VACIA);
    expect(conPrologo(conP)).toBe(conP);
  });

  it('un concepto queda establecido con un solo sub-nivel: es la regla del enlace', () => {
    let p = conEstablecido(PARTIDA_VACIA, 1, 4);
    p = conEstablecido(p, 1, 0);
    p = conEstablecido(p, 6, 1);
    expect([...conceptosEstablecidos(p)].sort()).toEqual([1, 6]);
    expect([...subsEstablecidos(p, 1)].sort()).toEqual([0, 4]);
    expect(subsEstablecidos(p, 5).size).toBe(0);
  });

  it('con el almacén bloqueado se juega igual: leer da vacía y guardar avisa que no pudo', () => {
    const roto = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(cargarPartida(roto, SUBS)).toEqual(PARTIDA_VACIA);
    expect(guardarPartida(roto, conPrologo(PARTIDA_VACIA))).toBeFalse();
    expect(cargarPartida(null, SUBS)).toEqual(PARTIDA_VACIA);
    expect(guardarPartida(null, PARTIDA_VACIA)).toBeFalse();
  });

  it('guarda y carga contra un almacén real bajo la clave del cuaderno', () => {
    const memoria = new Map<string, string>();
    const almacen = {
      getItem: (k: string) => memoria.get(k) ?? null,
      setItem: (k: string, v: string) => void memoria.set(k, v),
    };
    const p = conEstablecido(conPrologo(PARTIDA_VACIA), 0, 5);
    expect(guardarPartida(almacen, p)).toBeTrue();
    expect(memoria.has(CLAVE_PARTIDA)).toBeTrue();
    expect(cargarPartida(almacen, SUBS)).toEqual(p);
  });
  describe('el punto donde quedó la historia', () => {
    const leer = (punto: unknown): Punto | null =>
      leerPartida(JSON.stringify({ v: 3, establecidos: [], cinematicas: [], punto }), SUBS).punto;

    it('ida y vuelta para los tres lugares', () => {
      const puntos: Punto[] = [
        { lugar: 'prologo', linea: 'anom-manual' },
        { lugar: 'construccion' },
        { lugar: 'recorrido', concepto: 3, sub: -1 },
        { lugar: 'recorrido', concepto: 0, sub: 6 },
      ];
      for (const punto of puntos) {
        const p = conPunto(PARTIDA_VACIA, punto);
        expect(leerPartida(escribirPartida(p), SUBS).punto).toEqual(punto);
      }
    });

    it('una partida de antes, sin punto, arranca del principio', () => {
      expect(leer(undefined)).toBeNull();
    });

    it('descarta un punto que no existe en el recorrido de hoy o no tiene forma', () => {
      expect(leer({ lugar: 'recorrido', concepto: 11, sub: -1 })).toBeNull();
      expect(leer({ lugar: 'recorrido', concepto: 0, sub: 7 })).toBeNull();
      expect(leer({ lugar: 'recorrido', concepto: 1, sub: -2 })).toBeNull();
      expect(leer({ lugar: 'recorrido', concepto: '1', sub: 0 })).toBeNull();
      expect(leer({ lugar: 'prologo', linea: '<script>' })).toBeNull();
      expect(leer({ lugar: 'prologo' })).toBeNull();
      expect(leer({ lugar: 'luna' })).toBeNull();
      expect(leer('construccion')).toBeNull();
    });

    it('volver al mismo punto no cambia la referencia, y otro sí', () => {
      const p = conPunto(PARTIDA_VACIA, { lugar: 'recorrido', concepto: 2, sub: 0 });
      expect(conPunto(p, { lugar: 'recorrido', concepto: 2, sub: 0 })).toBe(p);
      expect(conPunto(p, { lugar: 'recorrido', concepto: 2, sub: 1 })).not.toBe(p);
      expect(conPunto(p, null).punto).toBeNull();
    });
  });
});
