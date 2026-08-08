import { signalsRoutesTree, routes } from './app.routes';

/**
 * El árbol de conceptos es la fuente de datos que la vista integrada consume para embeber cada
 * sub-nivel. Sus dos invariantes se rompían en silencio: un sub-nivel sin componente daba una card
 * en blanco sin ningún error, y el nombre del sub-nivel se sacaba del primer <h1> del componente
 * montado, así que un sub-nivel sin título propio terminaba mostrando el de un widget interno.
 */
describe('signalsRoutesTree', () => {
  const subLevels = signalsRoutesTree.flatMap((level) =>
    (level.subLevels ?? []).map((sub) => ({ id: `${level.path}/${sub.path}`, sub })),
  );

  it('tiene los 12 conceptos del recorrido', () => {
    expect(signalsRoutesTree.length).toBe(12);
  });

  it('todo sub-nivel trae componente: sin esto la card se monta vacía y nadie se entera', () => {
    const sinComponente = subLevels.filter(({ sub }) => !sub.component).map(({ id }) => id);
    expect(sinComponente).toEqual([]);
  });

  it('todo sub-nivel declara su nombre para el topbar', () => {
    const sinTitulo = subLevels.filter(({ sub }) => !sub.title?.trim()).map(({ id }) => id);
    expect(sinTitulo).toEqual([]);
  });

  it('los nombres son propios de cada sub-nivel, no un rótulo repetido', () => {
    const titulos = subLevels.map(({ sub }) => sub.title);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it('el comodín manda a la raíz: es el fallback del que depende el deep-link en Pages', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard).toBeTruthy();
    expect(wildcard?.redirectTo).toBe('');
  });

  it('la raíz sirve la vista integrada', () => {
    expect(routes.find((route) => route.path === '')?.component).toBeTruthy();
  });
});
