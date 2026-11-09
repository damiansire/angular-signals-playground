import { CONTADOR, HOST_PUBLICADO, rutaContable, urlDeConteo, Visita } from './visitas';

function visita(cambios: Partial<Visita> = {}): Visita {
  return { host: HOST_PUBLICADO, url: '/', referente: '', automatizado: false, ...cambios };
}

describe('visitas', () => {
  it('cuenta la ruta en el sitio publicado', () => {
    expect(urlDeConteo(visita({ url: '/practica/carrito' }))).toBe(
      `${CONTADOR}?p=%2Fpractica%2Fcarrito`,
    );
  });

  it('no cuenta en el dev server ni en otro host', () => {
    expect(urlDeConteo(visita({ host: 'localhost' }))).toBeNull();
    expect(urlDeConteo(visita({ host: 'otro.github.io' }))).toBeNull();
  });

  it('no cuenta un navegador automatizado', () => {
    expect(urlDeConteo(visita({ automatizado: true }))).toBeNull();
  });

  it('el capítulo en la query no parte la vista integrada en varias páginas', () => {
    expect(rutaContable('/?capitulo=3&sub=2')).toBe('/');
    expect(rutaContable('/practica/carrito#total')).toBe('/practica/carrito');
    expect(rutaContable('')).toBe('/');
  });

  it('manda el referente solo si lo hay', () => {
    const url = new URL(urlDeConteo(visita({ referente: 'https://dev.to/x' }))!);
    expect(url.searchParams.get('r')).toBe('https://dev.to/x');
    expect(new URL(urlDeConteo(visita())!).searchParams.has('r')).toBeFalse();
  });
});
