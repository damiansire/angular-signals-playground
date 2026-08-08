import { initPrologoAnomalia } from './prologo-anomalia';

/**
 * El prólogo es el paso intermedio entre elegir el clima y que arranque la construcción de Tusi.
 * Si no puede inicializarse (falta su markup), tiene que ceder la posta igual: `alTerminar` es lo
 * único que destraba la landing. Antes devolvía un no-op sin llamarlo y la pantalla quedaba
 * congelada para siempre, con el clima ya elegido y nada ocurriendo.
 */
describe('initPrologoAnomalia', () => {
  it('cede la posta aunque no encuentre su markup: la landing no puede quedar trabada', () => {
    const host = document.createElement('div');
    let terminado = 0;

    const cerrar = initPrologoAnomalia(host, { alTerminar: () => (terminado += 1) });

    expect(terminado).toBe(1);
    expect(typeof cerrar).toBe('function');
    expect(() => cerrar()).not.toThrow();
  });
});
