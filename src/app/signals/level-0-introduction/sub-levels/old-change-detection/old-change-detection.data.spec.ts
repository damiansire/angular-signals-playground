import { APIS, ZONA_INICIAL, correr, quedoVieja, siguienteApi } from './old-change-detection.data';

const [SIN_PARCHE, PARCHEADA] = APIS;

describe('old-change-detection (dominio "Zone.js solo ve lo que parchea")', () => {
  it('arranca con la API que Zone.js no parchea, y las demás sí', () => {
    expect(SIN_PARCHE.parcheada).toBeFalse();
    expect(APIS.slice(1).every((api) => api.parcheada)).toBeTrue();
  });

  it('cada API trae su renglón real', () => {
    for (const api of APIS) expect(api.renglon).toContain(api.nombre);
  });

  it('sin parche, el valor sube pero la pantalla no se entera ni revisa nada', () => {
    const estado = correr(ZONA_INICIAL, SIN_PARCHE);
    expect(estado).toEqual({ total: 1, enPantalla: 0, revisados: 0 });
    expect(quedoVieja(estado)).toBeTrue();
  });

  it('con parche, revisa el árbol entero y la pantalla queda al día', () => {
    const roto = correr(correr(ZONA_INICIAL, SIN_PARCHE), SIN_PARCHE);
    const arreglado = correr(roto, PARCHEADA);
    expect(arreglado).toEqual({ total: 3, enPantalla: 3, revisados: 7 });
    expect(quedoVieja(arreglado)).toBeFalse();
  });

  it('cualquier API parcheada revisa los siete', () => {
    for (const api of APIS.slice(1)) expect(correr(ZONA_INICIAL, api).revisados).toBe(7);
  });

  it('el hueco rota por todas las APIs y vuelve a la primera', () => {
    const vuelta = APIS.reduce((api) => siguienteApi(api), SIN_PARCHE);
    expect(vuelta).toBe(SIN_PARCHE);
    expect(siguienteApi(SIN_PARCHE)).toBe(PARCHEADA);
  });
});
