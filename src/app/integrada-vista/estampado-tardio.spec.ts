import { vigilarEstampado } from './estampado-tardio';

/** Los registros del MutationObserver llegan en una microtarea. */
const despuesDeLosRegistros = (): Promise<void> => Promise.resolve();

describe('vigilarEstampado', () => {
  const ENC = '_ngcontent-ng-c123';
  let host: HTMLElement;

  beforeEach(() => {
    host = document.body.appendChild(document.createElement('div'));
  });
  afterEach(() => host.remove());

  it('estampa lo que aparece después del montaje, con todo su árbol', async () => {
    const soltar = vigilarEstampado(host, ENC);
    const fila = document.createElement('p');
    fila.innerHTML = '<span>Valor:</span> <b>3</b>';
    host.appendChild(document.createElement('section')).appendChild(fila);
    await despuesDeLosRegistros();

    const estampados = [fila, ...fila.querySelectorAll('*')].map((e) => e.hasAttribute(ENC));
    expect(estampados).toEqual([true, true, true]);
    soltar();
  });

  it('al soltarlo deja de estampar', async () => {
    vigilarEstampado(host, ENC)();
    const tarde = host.appendChild(document.createElement('p'));
    await despuesDeLosRegistros();

    expect(tarde.hasAttribute(ENC)).toBeFalse();
  });
});
