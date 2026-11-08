import { tokensDeCodigo, type TipoDeToken } from './resaltado-de-codigo';

/** Los tokens sin los espacios, como pares `texto:tipo`, para comparar de un vistazo. */
function leer(renglon: string): string[] {
  return tokensDeCodigo(renglon)
    .filter((t) => t.tipo !== 'espacio')
    .map((t) => `${t.texto}:${t.tipo}`);
}

function tipoDe(renglon: string, texto: string): TipoDeToken | undefined {
  return tokensDeCodigo(renglon).find((t) => t.texto === texto)?.tipo;
}

describe('tokensDeCodigo: el resaltado de los renglones de un desafío', () => {
  it('pegar los tokens devuelve el renglón exacto', () => {
    const renglones = [
      'const rumbo$ = lecturas$.pipe(',
      '  filter((p) => p - deriva),',
      "  { transform: 'translateX(80px)' },",
      '<button (click)="sumar()">+1</button>',
      "// el título es <h2 class='titulo'>",
      'readonly total = signal<number>(0);',
      '',
    ];
    for (const r of renglones) {
      expect(
        tokensDeCodigo(r)
          .map((t) => t.texto)
          .join(''),
      ).toBe(r);
    }
  });

  it('separa palabras del lenguaje, flujos, llamadas y nombres', () => {
    expect(leer('const rumbo$ = lecturas$.pipe(')).toEqual([
      'const:clave',
      'rumbo$:flujo',
      '=:operador',
      'lecturas$:flujo',
      '.:puntuacion',
      'pipe:llamada',
      '(:puntuacion',
    ]);
  });

  it('el operador de RxJS se lee como llamada, y la flecha como un solo operador', () => {
    expect(leer('  map((p) => p - deriva),')).toEqual([
      'map:llamada',
      '(:puntuacion',
      '(:puntuacion',
      'p:nombre',
      '):puntuacion',
      '=>:operador',
      'p:nombre',
      '-:operador',
      'deriva:nombre',
      '):puntuacion',
      ',:puntuacion',
    ]);
  });

  it('una cadena es un solo token aunque tenga paréntesis o comillas de otro tipo adentro', () => {
    expect(tipoDe("{ transform: 'translateX(80px)' },", "'translateX(80px)'")).toBe('cadena');
    expect(tipoDe('<p class="a">', '"a"')).toBe('cadena');
  });

  it('el comentario va hasta el final del renglón, con etiquetas y todo', () => {
    expect(leer("// el título es <h2 class='titulo'>")).toEqual([
      "// el título es <h2 class='titulo'>:comentario",
    ]);
  });

  it('una etiqueta de HTML se reconoce, pero un genérico pegado al nombre no', () => {
    expect(tipoDe('<button (click)="sumar()">', '<button')).toBe('etiqueta');
    expect(tipoDe('</p>', '</p')).toBe('etiqueta');
    expect(leer('signal<number>(0)')).toEqual([
      'signal:llamada',
      '<:operador',
      'number:nombre',
      '>:operador',
      '(:puntuacion',
      '0:numero',
      '):puntuacion',
    ]);
  });

  it('los números, con unidad o sin ella, y una llamada con espacio antes del paréntesis', () => {
    expect(tipoDe('  throttleTime(100),', '100')).toBe('numero');
    expect(tipoDe('width: 320px;', '320px')).toBe('numero');
    expect(tipoDe('effect (fn)', 'effect')).toBe('llamada');
    expect(tipoDe('readonly id = input<string>();', 'input')).toBe('llamada');
    expect(tipoDe('a < b', 'a')).toBe('nombre');
  });
});
