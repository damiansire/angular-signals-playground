import {
  BEATS_COMUNES,
  CAPITULO_FINAL,
  CAPITULO_REVELACION,
  COLA_MS,
  duracionDe,
  lineasPara,
  problemasDe,
  relojDe,
  type Cinematica,
} from './cinematica-guion';
import { CINEMATICAS } from './cinematicas-datos';
import { CAPITULO_DE_CONCEPTO } from '../viaje';

/** Un capítulo mínimo que cumple todo, para variar de a una regla por test. */
function capitulo(cambios: Partial<Cinematica> = {}): Cinematica {
  return {
    capitulo: 1,
    titulo: 'El que avisa',
    ley: 'Un valor avisa solo a quien lo lee.',
    apertura: ['titulo', 'faro'],
    beats: ['faro'],
    lineas: [
      { id: 'c1-a', quien: 'cap', txt: 'Esto no se mueve solo.', beat: 'naves' },
      { id: 'c1-b', quien: 'naveA', txt: '¿Quién lo está mirando?' },
      { id: 'c1-c', quien: 'naveB', txt: 'Nadie, y nadie se entera.' },
      { id: 'c1-d', quien: 'mascota', txt: 'Mírenlo, entonces.', beat: 'mascota' },
    ],
    ...cambios,
  };
}

describe('cinematica-guion', () => {
  describe('reglas', () => {
    it('un capítulo bien escrito no tiene problemas', () => {
      expect(problemasDe(capitulo())).toEqual([]);
    });

    it('una línea de nueve palabras rompe el techo de ocho', () => {
      const c = capitulo({
        lineas: [
          ...capitulo().lineas.slice(0, 3),
          { id: 'c1-x', quien: 'cap', txt: 'uno dos tres cuatro cinco seis siete ocho nueve' },
        ],
      });
      expect(problemasDe(c).join()).toContain('9 palabras');
    });

    it('rechaza la raya en el texto y en la ley', () => {
      const conRaya = capitulo({
        ley: 'Un valor — avisa.',
        lineas: [
          ...capitulo().lineas.slice(0, 3),
          { id: 'c1-x', quien: 'cap', txt: 'Hola — chau' },
        ],
      });
      const problemas = problemasDe(conRaya).join('|');
      expect(problemas).toContain('usa raya');
      expect(problemas).toContain('la ley usa raya');
    });

    it('rechaza un beat que la escena no declara, en líneas y en apertura', () => {
      const c = capitulo({ apertura: ['titulo', 'fantasma'] });
      expect(problemasDe(c).join()).toContain('"fantasma"');
      const d = capitulo({
        lineas: [
          ...capitulo().lineas.slice(0, 3),
          { id: 'c1-x', quien: 'cap', txt: 'Ya.', beat: 'nada' },
        ],
      });
      expect(problemasDe(d).join()).toContain('beat "nada" no declarado');
    });

    it('los beats comunes del kit valen en cualquier escena sin declararlos', () => {
      const c = capitulo({
        beats: [],
        apertura: [...BEATS_COMUNES],
        lineas: capitulo().lineas.map((l) => ({ ...l, beat: 'transmision' })),
      });
      expect(problemasDe(c)).toEqual([]);
    });

    it('marca ids repetidos, renglones de más y renglones anchos', () => {
      const c = capitulo({
        lineas: [
          { id: 'c1-a', quien: 'cap', txt: 'uno\ndos\ntres' },
          { id: 'c1-a', quien: 'cap', txt: 'Una frase que es demasiado ancha para un renglón' },
          ...capitulo().lineas.slice(1),
        ],
      });
      const problemas = problemasDe(c).join('|');
      expect(problemas).toContain('id repetido');
      expect(problemas).toContain('más de dos renglones');
      expect(problemas).toContain('columnas');
    });

    it('pocas o demasiadas líneas también son un problema', () => {
      expect(problemasDe(capitulo({ lineas: capitulo().lineas.slice(0, 2) })).join()).toContain(
        '2 líneas',
      );
    });

    it('"si" solo tiene sentido en el final', () => {
      const c = capitulo({
        lineas: capitulo().lineas.map((l, i) => (i === 0 ? { ...l, si: 'completo' as const } : l)),
      });
      expect(problemasDe(c).join()).toContain('"si" solo va en el final');
    });
  });

  describe('final', () => {
    const final: Cinematica = {
      capitulo: CAPITULO_FINAL,
      titulo: 'La salida',
      ley: 'Quien lee, avisa.',
      apertura: ['titulo'],
      beats: [],
      lineas: [
        { id: 'f-a', quien: 'cap', txt: 'Llegamos.' },
        { id: 'f-b', quien: 'naveA', txt: 'Todo encendido.', si: 'completo' },
        { id: 'f-c', quien: 'naveA', txt: 'Quedaron tramos apagados.', si: 'incompleto' },
        { id: 'f-d', quien: 'naveB', txt: '¿Y ahora?' },
        { id: 'f-e', quien: 'mascota', txt: 'Ahora saben leer.' },
      ],
    };

    it('cada partida ve solo su variante', () => {
      expect(lineasPara(final, true).map((l) => l.id)).toEqual(['f-a', 'f-b', 'f-d', 'f-e']);
      expect(lineasPara(final, false).map((l) => l.id)).toEqual(['f-a', 'f-c', 'f-d', 'f-e']);
    });

    it('valida las dos variantes, no solo una', () => {
      const cortoSiIncompleto: Cinematica = {
        ...final,
        lineas: final.lineas.filter((l) => l.id !== 'f-d' && l.id !== 'f-e'),
      };
      expect(problemasDe(cortoSiIncompleto).length).toBeGreaterThan(0);
    });
  });

  describe('reloj', () => {
    it('sale del texto y no se pisa: cada línea entra cuando la anterior terminó', () => {
      const reloj = relojDe(capitulo(), true);
      expect(reloj.length).toBe(4);
      for (let i = 1; i < reloj.length; i++) {
        expect(reloj[i].t0).toBeGreaterThanOrEqual(reloj[i - 1].t1);
      }
    });

    it('no depende de la máquina: sin voz sintética, el mismo guion dura siempre lo mismo', () => {
      expect(relojDe(capitulo(), true)).toEqual(relojDe(capitulo(), true));
    });

    it('la duración deja una cola después de la última línea', () => {
      const reloj = relojDe(capitulo(), true);
      expect(duracionDe(reloj)).toBe(reloj[reloj.length - 1].t1 + COLA_MS);
    });
  });

  describe('los guiones reales', () => {
    it('hay una cinemática por capítulo del recorrido, la revelación y un final, sin repetir', () => {
      const capitulos = CINEMATICAS.map((c) => c.capitulo).sort((a, b) => a - b);
      expect(capitulos).toEqual([...CAPITULO_DE_CONCEPTO, CAPITULO_FINAL, CAPITULO_REVELACION]);
    });

    it('la revelación va antes del final en el orden de la lista', () => {
      const orden = CINEMATICAS.map((c) => c.capitulo);
      expect(orden.indexOf(CAPITULO_REVELACION)).toBe(orden.indexOf(CAPITULO_FINAL) - 1);
    });

    it('ninguno rompe las reglas del guion', () => {
      const todos = CINEMATICAS.flatMap((c) => problemasDe(c));
      expect(todos).toEqual([]);
    });

    it('el capítulo 11 lleva la respuesta a la pregunta del recorrido y alguien la pregunta', () => {
      const once = CINEMATICAS.find((c) => c.capitulo === 11);
      // La respuesta es su título (se lee en la tarjeta); en las líneas se vuelve a hacer la
      // pregunta del capítulo 0, así la respuesta llega como cierre y no como cartel.
      expect(once?.titulo).toMatch(/quien lee, avisa/i);
      const textos = once?.lineas.map((l) => l.txt.replace(/\n/g, ' ')).join(' ') ?? '';
      expect(textos).toMatch(/quién le avisó a la pantalla/i);
    });

    it('la exploradora solo habla por transmisión: su primera línea llega con la onda', () => {
      for (const c of CINEMATICAS) {
        const idx = c.lineas.findIndex((l) => l.quien === 'nave4');
        if (idx < 0) continue;
        const antes = c.lineas.slice(0, idx + 1).some((l) => l.beat === 'transmision');
        expect(antes).withContext(`capítulo ${c.capitulo}`).toBeTrue();
      }
    });
  });
});
