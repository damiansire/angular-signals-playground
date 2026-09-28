import { MARCADOR_GUION, empalmarGuion, serializarGuion } from './guion-serializer';
import { type LineaGuion } from '../../integrada-vista/prologo-guion';

/** Lo que rodea al literal en prologo-guion.ts es justo lo que el Estudio no puede perder. */
const ANTES = `/**
 * Comentario de diseño que el Estudio no conoce.
 */

export type Hablante = 'cap' | 'naveA';

`;
const DESPUES = `

/** Una función que evolucionó después de que el Estudio existiera. */
export function anclajesDe(): number {
  return 42;
}
`;
const ARCHIVO = `${ANTES}${MARCADOR_GUION}
  { id: 'vieja', quien: 'cap', txt: 'Texto viejo.' },
];${DESPUES}`;

const GUION_NUEVO: readonly LineaGuion[] = [
  { id: 'hola', quien: 'cap', txt: 'Hola.' },
  { id: 'chau', quien: 'naveA', txt: 'Chau.' },
];

describe('empalmarGuion', () => {
  it('reemplaza solo el literal de GUION y deja el resto byte a byte', () => {
    const empalmado = empalmarGuion(ARCHIVO, GUION_NUEVO);

    expect(empalmado).toBe(
      `${ANTES}${MARCADOR_GUION}\n` +
        `  { id: 'hola', quien: 'cap', txt: 'Hola.' },\n` +
        `  { id: 'chau', quien: 'naveA', txt: 'Chau.' },\n` +
        `];${DESPUES}`,
    );
  });

  it('guardar dos veces lo mismo no cambia nada', () => {
    const una = empalmarGuion(ARCHIVO, GUION_NUEVO);
    expect(empalmarGuion(una, GUION_NUEVO)).toBe(una);
  });

  it('tira si el marcador no está, en vez de escribir un archivo sin guion', () => {
    const sinMarcador = ARCHIVO.replace(MARCADOR_GUION, 'export const OTRO = [');
    expect(() => empalmarGuion(sinMarcador, GUION_NUEVO)).toThrowError(/aparece 0 veces/);
  });

  it('tira si el marcador aparece más de una vez: no hay forma de saber cuál es', () => {
    const duplicado = `${ARCHIVO}\n${MARCADOR_GUION}\n];\n`;
    expect(() => empalmarGuion(duplicado, GUION_NUEVO)).toThrowError(/aparece 2 veces/);
  });

  describe('los comentarios de adentro del guion', () => {
    const CON_NOTAS = `${ANTES}${MARCADOR_GUION}
  // ACTO 0 · la llegada.
  { id: 'hola', quien: 'cap', txt: 'Hola.' },

  // ACTO 1 · la despedida.
  {
    id: 'chau',
    // Dentro de la línea.
    quien: 'naveA',
    txt: 'Chau,\\nhasta luego.',
  },
  // Al final de todo.
];${DESPUES}`;
    const literalDe = (texto: string): string =>
      texto.slice(texto.indexOf(MARCADOR_GUION), texto.indexOf('\n];') + 3);

    it('guardar sin cambios no toca nada', () => {
      const guion: LineaGuion[] = [
        { id: 'hola', quien: 'cap', txt: 'Hola.' },
        { id: 'chau', quien: 'naveA', txt: 'Chau,\nhasta luego.' },
      ];
      const una = empalmarGuion(CON_NOTAS, guion);
      expect(literalDe(una)).toContain(
        '  // ACTO 1 · la despedida.\n  // Dentro de la línea.\n  {',
      );
      expect(empalmarGuion(una, guion)).toBe(una);
    });

    it('viajan con su línea cuando el Estudio la mueve', () => {
      const movido = empalmarGuion(CON_NOTAS, [
        { id: 'chau', quien: 'naveA', txt: 'Chau.' },
        { id: 'hola', quien: 'cap', txt: 'Hola.' },
      ]);
      expect(literalDe(movido)).toBe(
        `${MARCADOR_GUION}\n` +
          `  // ACTO 1 · la despedida.\n  // Dentro de la línea.\n` +
          `  { id: 'chau', quien: 'naveA', txt: 'Chau.' },\n` +
          `  // ACTO 0 · la llegada.\n` +
          `  { id: 'hola', quien: 'cap', txt: 'Hola.' },\n` +
          `  // Al final de todo.\n];`,
      );
    });

    it('los de una línea borrada pasan a la siguiente que sobrevive', () => {
      const sinHola = empalmarGuion(CON_NOTAS, [{ id: 'chau', quien: 'naveA', txt: 'Chau.' }]);
      expect(literalDe(sinHola)).toBe(
        `${MARCADOR_GUION}\n  // ACTO 0 · la llegada.\n\n  // ACTO 1 · la despedida.\n` +
          `  // Dentro de la línea.\n  { id: 'chau', quien: 'naveA', txt: 'Chau.' },\n` +
          `  // Al final de todo.\n];`,
      );
    });

    it('una línea nueva entra sin comentarios y no desordena los de las otras', () => {
      const conNueva = empalmarGuion(CON_NOTAS, [
        { id: 'hola', quien: 'cap', txt: 'Hola.' },
        { id: 'nueva', quien: 'cap', txt: 'Nueva.' },
        { id: 'chau', quien: 'naveA', txt: 'Chau.' },
      ]);
      expect(literalDe(conNueva)).toContain(
        "  { id: 'hola', quien: 'cap', txt: 'Hola.' },\n" +
          "  { id: 'nueva', quien: 'cap', txt: 'Nueva.' },\n\n  // ACTO 1 · la despedida.",
      );
    });
  });

  it('tira si GUION no cierra en un renglón propio', () => {
    const enLinea = ARCHIVO.replace(/\[\n[\s\S]*?\n\];/, '[];');
    expect(() => empalmarGuion(enLinea, GUION_NUEVO)).toThrowError(/renglón propio/);
  });
});

describe('serializarGuion', () => {
  it('escribe los campos opcionales en el orden del archivo y omite los que valen cero', () => {
    const codigo = serializarGuion([
      { id: 'a', hueco: 300, pisa: 200, junto: true, dur: 900, quien: 'todos', txt: '¡Ya!' },
      { id: 'b', hueco: 0, quien: 'cap', txt: 'Sin pausa.' },
    ]);

    expect(codigo).toContain(
      "  {\n    id: 'a',\n    hueco: 300,\n    pisa: 200,\n    junto: true,\n    dur: 900,\n" +
        "    quien: 'todos',\n    txt: '¡Ya!',\n  },",
    );
    expect(codigo).toContain("  { id: 'b', quien: 'cap', txt: 'Sin pausa.' },");
  });

  it('expande la línea con un corte de renglón a mano y lo escribe escapado', () => {
    const codigo = serializarGuion([{ id: 'c', quien: 'cap', txt: 'Uno,\ndos.' }]);
    expect(codigo).toContain("  {\n    id: 'c',\n    quien: 'cap',\n    txt: 'Uno,\\ndos.',\n  },");
  });

  it('expande la línea que no entra en cien columnas', () => {
    const txt = 'Una línea sin cortes que se pasa del ancho de cien columnas.';
    const codigo = serializarGuion([{ id: 'larga', quien: 'naveB', txt }]);
    expect(codigo).toContain(`  {\n    id: 'larga',`);
  });

  it('elige la comilla que menos escapes pide, como prettier', () => {
    const codigo = serializarGuion([
      { id: 'simple', quien: 'cap', txt: "It's" },
      { id: 'doble', quien: 'cap', txt: 'Dijo "ya"' },
    ]);
    expect(codigo).toContain(`txt: "It's" }`);
    expect(codigo).toContain(`txt: 'Dijo "ya"' }`);
  });

  it('rechaza un guion vacío: dejaría el prólogo sin anclajes', () => {
    expect(() => serializarGuion([])).toThrowError(/al menos una línea/);
  });

  it('rechaza un texto que no es string en vez de escribir TypeScript roto', () => {
    const rota = { id: 'x', quien: 'cap', txt: 42 } as unknown as LineaGuion;
    expect(() => serializarGuion([rota])).toThrowError(/"0.txt" tiene que ser texto/);
  });
});
