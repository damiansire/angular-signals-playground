const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/**
 * El código como HTML con puntos de corte (`<wbr>`) después de `.`, `(` y de cada operador que
 * termina en `=` (`=`, `===`, `=>`). Mostrado angosto, el navegador solo podía cortar en los
 * espacios o, si no alcanzaba, en cualquier letra: "textCont|ent", "'#|count'". Con estos cortes
 * el renglón se parte donde se lee bien. El texto va escapado, así un `<app-rating />` se muestra y
 * no se interpreta; va por `[innerHTML]`, que conserva `<wbr>`.
 */
export function conCortes(codigo: string): string {
  // Los cortes se marcan sobre el texto crudo y recién después se escapa: al revés, `=>` ya era
  // `=&gt;` y el corte caía entre `=` y `>`.
  const conMarcas = codigo
    .replace(/\.(?!\.)|\((?!\))|=+>?(?![=>])/g, (m) => m + MARCA)
    // Un identificador de 24 letras o más no entra entero en la columna angosta (11/1 a 820:
    // "provideZoneChangeDetecti|on()"): ahí también se ofrece cortar en las jorobas del camelCase.
    // Uno más corto sigue sin cortes y, si no entra, baja entero al renglón siguiente.
    .replace(/[A-Za-z_$][\w$]{23,}/g, (id) => id.replace(/([a-z\d])(?=[A-Z])/g, `$1${MARCA}`));
  return conMarcas
    .replace(/[&<>"]/g, (c) => ESCAPES[c])
    .split(MARCA)
    .join('<wbr>');
}

/** Un carácter que el código mostrado nunca trae, para marcar dónde va cada corte. */
const MARCA = '\u0000';
