import { PERFILES, planDeBlips } from '../libs/sonido';
import {
  GUION,
  PRESUPUESTO,
  anclajesDe,
  armarReloj,
  largoDe,
  malformado,
  renglonesLargos,
  ventanaDe,
  type LineaGuion,
} from './prologo-guion';

/** Tres líneas mínimas para probar el encadenado sin arrastrar el guion entero. */
const CORTA: LineaGuion = { id: 'a', quien: 'cap', txt: 'Hola.' };
const OTRA: LineaGuion = { id: 'b', quien: 'naveA', txt: 'Chau.' };

describe('ventanaDe', () => {
  it('le da más tiempo a la línea más larga', () => {
    const corta = { id: 'x', quien: 'cap' as const, txt: 'Sí.' };
    const larga = { id: 'y', quien: 'cap' as const, txt: 'Una frase considerablemente más larga.' };
    expect(ventanaDe(larga)).toBeGreaterThan(ventanaDe(corta));
  });

  it('nunca baja del mínimo, por corta que sea la línea', () => {
    const minima = ventanaDe({ id: 'x', quien: 'cap', txt: 'No.' });
    expect(minima).toBe(PRESUPUESTO.minimo + PRESUPUESTO.entra + PRESUPUESTO.sale);
  });

  // El bug: `dur` como valor fijo podía dejar una línea MÁS CORTA de lo que cuesta leerla.
  it('`dur` es un piso: alarga una línea pero no la acorta por debajo de lo legible', () => {
    const conDur = { id: 'x', quien: 'cap' as const, txt: 'Ah.', dur: 6000 };
    expect(ventanaDe(conDur)).toBe(6000);

    const largaConDurChico = {
      id: 'y',
      quien: 'cap' as const,
      txt: 'Una frase larga que no entra en medio segundo por más que se lo pida.',
      dur: 500,
    };
    expect(ventanaDe(largaConDurChico)).toBeGreaterThan(500);
  });
});

describe('armarReloj', () => {
  it('encadena las líneas en orden y sin pisarse', () => {
    const reloj = armarReloj([CORTA, OTRA]);
    expect(reloj[1].t0).toBeGreaterThanOrEqual(reloj[0].t1);
  });

  it('deja el respiro entre turnos', () => {
    const reloj = armarReloj([CORTA, OTRA]);
    expect(reloj[1].t0 - reloj[0].t1).toBe(PRESUPUESTO.respiro);
  });

  it('`hueco` abre silencio antes de la línea, además del respiro', () => {
    const reloj = armarReloj([CORTA, { ...OTRA, hueco: 1000 }]);
    expect(reloj[1].t0 - reloj[0].t1).toBe(PRESUPUESTO.respiro + 1000);
  });

  it('`pisa` arranca antes de que termine la anterior, sin sumar respiro', () => {
    const reloj = armarReloj([CORTA, { ...OTRA, pisa: 500 }]);
    expect(reloj[0].t1 - reloj[1].t0).toBe(500);
  });

  it('`junto` arranca en el mismo instante que la anterior', () => {
    const reloj = armarReloj([CORTA, { ...OTRA, junto: true }]);
    expect(reloj[1].t0).toBe(reloj[0].t0);
  });

  it('después de dos juntas sigue desde la que termina más tarde', () => {
    const larga = { id: 'c', quien: 'naveB' as const, txt: 'Una frase bastante más larga.' };
    const reloj = armarReloj([CORTA, { ...larga, junto: true }, OTRA]);
    expect(reloj[2].t0).toBe(Math.max(reloj[0].t1, reloj[1].t1) + PRESUPUESTO.respiro);
  });

  it('el guion real avanza siempre hacia adelante', () => {
    const reloj = armarReloj(GUION);
    reloj.forEach((linea, i) => {
      if (i === 0) return;
      expect(linea.t0)
        .withContext(linea.id)
        .toBeGreaterThanOrEqual(reloj[i - 1].t0);
      expect(linea.t1).withContext(linea.id).toBeGreaterThan(linea.t0);
    });
  });
});

describe('anclajesDe', () => {
  it('el zoom cae donde termina el grito: el salto ocurre cuando entran, no por reloj', () => {
    const reloj = armarReloj(GUION);
    const grito = reloj.find((l) => l.id === 'anom-grito')!;
    expect(anclajesDe(reloj).zoom).toBe(grito.t1);
  });

  it('el choque cae SOBRE "¿quién eres?": el impacto es la respuesta a la pregunta', () => {
    const reloj = armarReloj(GUION);
    const pregunta = reloj.find((l) => l.id === 'reclamo-quien-eres')!;
    const { choque } = anclajesDe(reloj);
    expect(choque).toBeGreaterThan(pregunta.t0);
    expect(choque).toBeLessThan(pregunta.t1);
  });

  it('el temblor arranca antes de que alguien pregunte qué pasa', () => {
    const reloj = armarReloj(GUION);
    const alarma = reloj.find((l) => l.id === 'anom-que-pasa')!;
    const { temblor } = anclajesDe(reloj);
    expect(temblor).toBeGreaterThan(0);
    expect(temblor).toBeLessThan(alarma.t0);
  });

  it('la fusión cubre todo el diálogo de la voz y termina en el choque', () => {
    const reloj = armarReloj(GUION);
    const { fusion, choque } = anclajesDe(reloj);
    expect(fusion).toBeLessThan(choque);
    const armonia = reloj.find((l) => l.id === 'voz-armonia')!;
    expect(armonia.t0).toBeGreaterThan(fusion);
    expect(armonia.t0).toBeLessThan(choque);
  });

  it('los momentos van en el orden de la historia', () => {
    const a = anclajesDe(armarReloj(GUION));
    const secuencia = [
      a.temblor,
      a.anomalia,
      a.zoom,
      a.caos,
      a.fusion,
      a.choque,
      a.frase,
      a.orden,
      a.fin,
    ];
    secuencia.forEach((momento, i) => {
      if (i === 0) return;
      expect(momento)
        .withContext(`momento ${i}`)
        .toBeGreaterThan(secuencia[i - 1]);
    });
  });

  it('avisa fuerte si un anclaje apunta a una línea que ya no existe', () => {
    const sinGrito = GUION.filter((l) => l.id !== 'anom-grito');
    expect(() => anclajesDe(armarReloj(sinGrito))).toThrowError(/anom-grito/);
  });
});

describe('el guion publicado', () => {
  it('está bien armado', () => {
    expect(malformado(GUION)).toEqual([]);
  });

  it('detecta un id repetido', () => {
    const roto = [GUION[0], { ...GUION[1], id: GUION[0].id }];
    expect(malformado(roto)).toContain(`el id "${GUION[0].id}" está repetido`);
  });

  // No hace falta auditar que cada línea sea legible: la ventana se deriva del presupuesto, así que
  // es una propiedad de la estructura. Lo que sí puede romperse a mano son las constantes.
  it('ninguna línea puede ir más rápido que el presupuesto, por larga que sea', () => {
    const larguisima: LineaGuion = { id: 'x', quien: 'cap', txt: 'x'.repeat(400), dur: 1200 };
    const legible = ventanaDe(larguisima) - PRESUPUESTO.entra - PRESUPUESTO.sale;
    expect(largoDe(larguisima) / (legible / 1000)).toBeLessThanOrEqual(PRESUPUESTO.cps + 0.5);
  });

  it('ningún renglón declarado se pasa del techo de columnas', () => {
    expect(renglonesLargos(GUION)).toEqual([]);
  });

  it('la baranda de columnas avisa cuando un renglón se va a partir solo', () => {
    const ancha: LineaGuion = { id: 'ancha', quien: 'cap', txt: 'palabra '.repeat(12) };
    expect(renglonesLargos([ancha]).length).toBe(1);
  });

  it('detecta la primera línea marcada como simultánea', () => {
    expect(malformado([{ ...GUION[0], junto: true }])).toContain(
      `"${GUION[0].id}" arranca junta a nada: es la primera`,
    );
  });

  it('tiene una sola superposición, que es la interrupción de la exploradora', () => {
    const reloj = armarReloj(GUION);
    const encimadas = reloj.filter((l, i) => i > 0 && l.t0 < reloj[i - 1].t1 && !l.junto);
    expect(encimadas.map((l) => l.id)).toEqual(['casa-apuren']);
  });

  it('las dos parejas que gritan a la vez arrancan exactamente juntas', () => {
    const reloj = armarReloj(GUION);
    for (const id of ['dentro-esquiva-ya', 'reclamo-circulos']) {
      const i = reloj.findIndex((l) => l.id === id);
      expect(reloj[i].t0)
        .withContext(id)
        .toBe(reloj[i - 1].t0);
    }
  });

  // El prólogo va a ritmo de lectura y cada personaje habla con blips que se reparten en la ventana
  // de su línea. Si la ventana queda corta, el director aprieta el paso hasta un mínimo y ahí empieza
  // a tirar las últimas sílabas: la frase se corta, y eso no se ve, se escucha.
  it('a ritmo de lectura, cada personaje dice su línea entera, sin perder sílabas', () => {
    for (const linea of armarReloj(GUION)) {
      const perfil = PERFILES[linea.quien];
      const entera = planDeBlips(linea.txt, Number.MAX_SAFE_INTEGER, perfil).length;
      const dicha = planDeBlips(linea.txt, linea.t1 - linea.t0, perfil).length;
      expect(dicha).withContext(linea.id).toBe(entera);
    }
  });
});
