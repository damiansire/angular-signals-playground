import { routes } from './app.routes';

describe('routes', () => {
  it('el comodín manda a la raíz: es el fallback del que depende el deep-link en Pages', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard).toBeTruthy();
    expect(wildcard?.redirectTo).toBe('');
  });

  it('la raíz sirve la vista integrada', () => {
    expect(routes.find((route) => route.path === '')?.component).toBeTruthy();
  });
});
