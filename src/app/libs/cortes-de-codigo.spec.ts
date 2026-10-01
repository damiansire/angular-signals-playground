import { conCortes } from './cortes-de-codigo';

describe('conCortes: puntos de corte para mostrar código angosto', () => {
  it('ofrece cortar después de ".", "(" y "=", no a mitad de un identificador', () => {
    expect(conCortes("querySelector('#count').textContent = count")).toBe(
      "querySelector(<wbr>'#count').<wbr>textContent =<wbr> count",
    );
  });

  it('escapa el HTML del código: un <tag> se muestra, no se interpreta', () => {
    expect(conCortes('<app-rating [(value)]="rating" />')).toBe(
      '&lt;app-rating [(<wbr>value)]=<wbr>&quot;rating&quot; /&gt;',
    );
    expect(conCortes('a && b')).toBe('a &amp;&amp; b');
  });

  it('no toca la sangría ni el resto del texto', () => {
    expect(conCortes('  count++')).toBe('  count++');
    expect(conCortes('')).toBe('');
  });

  it('no corta dentro de "===", "=>" ni de unos "()" vacíos', () => {
    expect(conCortes('a === b')).toBe('a ===<wbr> b');
    // El `>` sale escapado: el corte va después de la flecha entera, no entre `=` y `&gt;`.
    expect(conCortes('() => x')).toBe('() =&gt;<wbr> x');
    expect(conCortes('[...lista]')).toBe('[...<wbr>lista]');
  });

  it('corta en el camelCase solo los identificadores que no entran en la columna angosta', () => {
    expect(conCortes('// sin provideZoneChangeDetection()')).toBe(
      '// sin provide<wbr>Zone<wbr>Change<wbr>Detection()',
    );
    expect(conCortes('bootstrapApplication(App')).toBe('bootstrapApplication(<wbr>App');
  });
});
