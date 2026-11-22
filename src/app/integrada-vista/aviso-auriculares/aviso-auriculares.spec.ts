import {
  BASE_DE_LA_PIEDRA,
  CAJA_DE_LA_PIEDRA,
  CHOQUE_MS,
  LA_COLINA_APARECE_MS,
  LLAMADO,
  PANEO,
  RADIO_DE_LA_LUZ,
  RADIO_DEL_PLANETA,
  SE_VA_LO_LEJANO_DESDE_MS,
  SE_VA_LO_LEJANO_HASTA_MS,
  SE_VUELVE_LUZ_MS,
  camaraDelPlaneta,
  cuadroDeLaCaida,
  cuandoSeAbre,
  cuandoSuena,
  dibujoDelPlaneta,
  dondeVaLaEstrella,
  estrellasDelAlba,
  letrasDelLlamado,
  planDeLaPrueba,
  type EscenarioDeLaCaida,
} from './aviso-auriculares';
import { LUZ_DEL_CHOQUE_MS, luzDelChoque } from '../inicio-angie';

describe('aviso de auriculares', () => {
  describe('la prueba', () => {
    const plan = planDeLaPrueba();

    it('suena primero a la izquierda, después a la derecha y al final en los dos', () => {
      const izquierda = cuandoSuena(plan, 'izquierda');
      const derecha = cuandoSuena(plan, 'derecha');
      const ambos = cuandoSuena(plan, 'ambos');
      expect(izquierda).toBe(0);
      expect(derecha).toBeGreaterThan(izquierda);
      expect(ambos).toBeGreaterThan(derecha);
      // Un lado no se pisa con el siguiente: si no, no se oye que cambia de oído.
      const ultimaIzquierda = Math.max(
        ...plan.filter((n) => n.lado === 'izquierda').map((n) => n.t),
      );
      expect(ultimaIzquierda).toBeLessThan(derecha);
    });

    it('cada lado va a su oído, y el acorde, al medio', () => {
      expect(PANEO.izquierda).toBeLessThan(0);
      expect(PANEO.derecha).toBeGreaterThan(0);
      expect(PANEO.ambos).toBe(0);
      expect(Math.abs(PANEO.izquierda)).toBeLessThan(1);
    });

    it('el telón sube después de la última nota y antes de los dos segundos', () => {
      const ultima = Math.max(...plan.map((n) => n.t));
      expect(cuandoSeAbre(plan)).toBeGreaterThan(ultima);
      expect(cuandoSeAbre(plan)).toBeLessThan(2);
    });

    it('un lado que no suena se avisa, no se dibuja en cero', () => {
      expect(() => cuandoSuena([], 'derecha')).toThrowError(/derecha/);
    });
  });

  describe('las estrellas', () => {
    it('son las mismas en cada visita', () => {
      expect(estrellasDelAlba(7, 30)).toEqual(estrellasDelAlba(7, 30));
    });

    it('quedan en la mitad de arriba del dibujo, donde todavía es de noche', () => {
      for (const e of estrellasDelAlba(7, 200)) {
        expect(e.x).toBeGreaterThanOrEqual(0);
        expect(e.x).toBeLessThanOrEqual(1920);
        expect(e.y).toBeGreaterThanOrEqual(0);
        expect(e.y).toBeLessThanOrEqual(600);
      }
    });
  });

  describe('el llamado', () => {
    it('se arma de nuevo con las mismas letras, en palabras enteras', () => {
      const palabras = letrasDelLlamado(LLAMADO);
      expect(palabras.map((p) => p.map((l) => l.c).join('')).join(' ')).toBe(LLAMADO);
    });

    it('la ola recorre la frase entera: el índice sigue de una palabra a la otra', () => {
      const indices = letrasDelLlamado('ab cd e')
        .flat()
        .map((l) => l.i);
      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it('los espacios de más no dejan palabras vacías', () => {
      expect(letrasDelLlamado(' a  b ').length).toBe(2);
    });
  });
});

describe('la caída: Angie se vuelve luz y cae en la colina', () => {
  // A wide screen with the hill's stone in the middle, a bit below.
  const ancha: EscenarioDeLaCaida = {
    ancho: 1920,
    alto: 1080,
    angie: { x: 960, y: 421 },
    piedra: { x: 958, y: 837, ancho: 446 },
  };
  // A phone held upright.
  const celular: EscenarioDeLaCaida = {
    ancho: 390,
    alto: 844,
    angie: { x: 195, y: 330 },
    piedra: { x: 195, y: 640, ancho: 172 },
  };
  const tiempos = (hasta: number, paso = 20): number[] =>
    Array.from({ length: Math.floor(hasta / paso) + 1 }, (_, i) => i * paso);

  it('arranca como el aviso: Angie entera, el texto a la vista y todavía sin luz ni espacio', () => {
    const c = cuadroDeLaCaida(0, ancha);
    expect(c.texto.opacidad).toBe(1);
    expect(c.angie).toEqual(jasmine.objectContaining({ dy: -0, sx: 1, sy: 1, opacidad: 1 }));
    expect(c.estrella.opacidad).toBe(0);
    expect(c.espacio).toBe(0);
    expect(c.noche).toEqual({ dy: 0, opacidad: 1 });
  });

  it('se aplasta antes de saltar: anticipación sobre los pies', () => {
    const c = cuadroDeLaCaida(250, ancha);
    expect(c.angie.sy).toBeLessThan(0.9);
    expect(c.angie.sx).toBeGreaterThan(1);
    expect(c.angie.dy).toBeCloseTo(0, 5);
  });

  it('la estrella nace donde Angie estalla en luz, y ella ya no está', () => {
    const c = cuadroDeLaCaida(SE_VUELVE_LUZ_MS + 150, ancha);
    const nace = dondeVaLaEstrella(SE_VUELVE_LUZ_MS, ancha);
    expect(nace.x).toBeCloseTo(c.destello.x, 5);
    expect(nace.y).toBeCloseTo(c.destello.y, 5);
    expect(c.destello.opacidad).toBeGreaterThan(0);
    expect(c.estrella.opacidad).toBe(1);
    expect(c.angie.opacidad).toBe(0);
  });

  it('cae sobre la piedra justo en el choque, y se apaga ahí', () => {
    for (const e of [ancha, celular]) {
      const llega = dondeVaLaEstrella(CHOQUE_MS, e);
      expect(Math.abs(llega.x - e.piedra.x)).toBeLessThan(1);
      // Over the stone's middle: above its base, within its box.
      expect(llega.y).toBeLessThan(e.piedra.y);
      expect(llega.y).toBeGreaterThan(e.piedra.y - e.piedra.ancho / 2);
      expect(cuadroDeLaCaida(CHOQUE_MS + 200, e).estrella.opacidad).toBe(0);
    }
  });

  it('la cámara termina con la piedra del planeta sobre la de la colina', () => {
    for (const e of [ancha, celular]) {
      const c = camaraDelPlaneta(CHOQUE_MS, e);
      const izquierda = c.x + CAJA_DE_LA_PIEDRA.x * c.k;
      const base = c.y + (CAJA_DE_LA_PIEDRA.y + BASE_DE_LA_PIEDRA * CAJA_DE_LA_PIEDRA.lado) * c.k;
      expect(izquierda).toBeCloseTo(e.piedra.x - e.piedra.ancho / 2, 3);
      expect(CAJA_DE_LA_PIEDRA.lado * c.k).toBeCloseTo(e.piedra.ancho, 3);
      expect(base).toBeCloseTo(e.piedra.y, 3);
    }
  });

  it('la cámara solo se acerca, y pareja en escala: el planeta lejos dura lo que la colina cerca', () => {
    let antes = 0;
    for (const t of tiempos(CHOQUE_MS)) {
      const { k } = camaraDelPlaneta(t, ancha);
      expect(k).toBeGreaterThanOrEqual(antes);
      antes = k;
    }
    const lejos = camaraDelPlaneta(0, ancha).k;
    const cerca = camaraDelPlaneta(CHOQUE_MS, ancha).k;
    const mitad = camaraDelPlaneta((1100 + CHOQUE_MS) / 2, ancha).k;
    // In a straight line the middle would be at half the scale; even in scale it is far below.
    expect(mitad).toBeLessThan((lejos + cerca) / 4);
  });

  it('de lejos el planeta entra en la pantalla, también en un celular', () => {
    for (const e of [ancha, celular]) {
      const c = camaraDelPlaneta(1100, e);
      const radio = RADIO_DEL_PLANETA * c.k;
      expect(c.x - radio).toBeGreaterThan(0);
      expect(c.x + radio).toBeLessThan(e.ancho);
      expect(c.y + radio).toBeLessThan(e.alto);
    }
  });

  it('la estrella no sale de la pantalla en todo el vuelo', () => {
    for (const e of [ancha, celular]) {
      for (const t of tiempos(CHOQUE_MS)) {
        const c = cuadroDeLaCaida(t, e);
        if (!c.estrella.opacidad) continue;
        expect(c.estrella.x).withContext(`x a los ${t} ms`).toBeGreaterThan(0);
        expect(c.estrella.x).withContext(`x a los ${t} ms`).toBeLessThan(e.ancho);
        expect(c.estrella.y).withContext(`y a los ${t} ms`).toBeGreaterThan(0);
        expect(c.estrella.y).withContext(`y a los ${t} ms`).toBeLessThan(e.alto);
      }
    }
  });

  it('la cola va detrás de la estrella y se achica: no hay cola antes de que nazca', () => {
    expect(cuadroDeLaCaida(SE_VUELVE_LUZ_MS, ancha).cola.every((p) => p.r === 0)).toBeTrue();
    const { cola, estrella } = cuadroDeLaCaida(2500, ancha);
    expect(cola[0].r).toBeGreaterThan(cola[cola.length - 1].r);
    expect(Math.hypot(cola[0].x - estrella.x, cola[0].y - estrella.y)).toBeGreaterThan(0);
  });

  it('la colina se dibuja antes de que se vaya lo lejano, y las nubes tapan el cambio', () => {
    expect(LA_COLINA_APARECE_MS).toBeLessThan(SE_VA_LO_LEJANO_DESDE_MS);
    expect(cuadroDeLaCaida(SE_VA_LO_LEJANO_DESDE_MS, ancha).lejos).toBe(1);
    expect(cuadroDeLaCaida(SE_VA_LO_LEJANO_HASTA_MS, ancha).lejos).toBe(0);
    const mitad = (SE_VA_LO_LEJANO_DESDE_MS + SE_VA_LO_LEJANO_HASTA_MS) / 2;
    const tapa = Math.max(...cuadroDeLaCaida(mitad, ancha).nubes.map((n) => n.opacidad));
    expect(tapa).toBeGreaterThan(0.5);
  });

  it('la luz del choque arranca como la luz de la estrella, sin salto, y se apaga creciendo', () => {
    const { ancho, alto } = ancha;
    const estrella = cuadroDeLaCaida(CHOQUE_MS, ancha).estrella;
    const desde = RADIO_DE_LA_LUZ * estrella.escala;
    const toca = luzDelChoque(0, desde, ancho, alto);
    expect(toca.opacidad).toBe(estrella.opacidad);
    expect(toca.r).toBe(desde);
    const fin = luzDelChoque(LUZ_DEL_CHOQUE_MS, desde, ancho, alto);
    expect(fin.opacidad).toBe(0);
    expect(fin.r).toBeGreaterThan(3 * toca.r);
    // Same size on any screen, relative to it.
    const chica = luzDelChoque(LUZ_DEL_CHOQUE_MS, 1, celular.ancho, celular.alto);
    expect(chica.r / Math.sqrt(celular.ancho * celular.alto)).toBeCloseTo(
      fin.r / Math.sqrt(ancho * alto),
      5,
    );
  });

  it('la noche del aviso sube con la cámara y se va antes de que llegue el planeta de cerca', () => {
    const c = cuadroDeLaCaida(2100, ancha);
    expect(c.noche.opacidad).toBe(0);
    expect(c.noche.dy).toBeGreaterThan(0.8 * ancha.alto);
    expect(c.espacio).toBe(1);
  });
});

describe('el planetita de Angie', () => {
  it('sale igual con la misma semilla: el mismo planeta en cada visita', () => {
    expect(dibujoDelPlaneta(7)).toEqual(dibujoDelPlaneta(7));
    expect(dibujoDelPlaneta(7)).not.toEqual(dibujoDelPlaneta(8));
  });

  it('las flores y las praderas quedan adentro del disco', () => {
    const { flores, praderas } = dibujoDelPlaneta(7);
    for (const f of flores) expect(Math.hypot(f.cx, f.cy) + f.r).toBeLessThan(RADIO_DEL_PLANETA);
    for (const p of praderas) expect(Math.hypot(p.cx, p.cy)).toBeLessThan(RADIO_DEL_PLANETA);
  });

  it('el pasto da la vuelta entera, y sobre la loma va más alto', () => {
    const { matas } = dibujoDelPlaneta(7);
    expect(matas.length).toBe(120);
    expect(matas.find((m) => m.giro < 5)?.alto).toBeGreaterThan(RADIO_DEL_PLANETA + 30);
    expect(matas.find((m) => m.giro > 170 && m.giro < 190)?.alto).toBeLessThan(RADIO_DEL_PLANETA);
  });
});
