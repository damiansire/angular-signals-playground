import { IMPACTO } from '../libs/muelle';
import { initMundoQueResponde } from './mundo-que-responde';

describe('initMundoQueResponde', () => {
  let raiz: HTMLElement;
  let golpes: number;
  let cerrar: () => void;
  const contar = (): void => {
    golpes++;
  };

  beforeEach(() => {
    golpes = 0;
    raiz = document.createElement('div');
    // Como el `#main-content` real: `tabindex="-1"` para el salto de teclado, y toda la página adentro.
    raiz.id = 'main-content';
    raiz.tabIndex = -1;
    raiz.innerHTML = `
      <div id="stage">
        <div class="holder" style="position: relative">
          <p id="fondo">fondo</p>
          <button id="boton">boton</button>
        </div>
        <svg><g id="sacudida"></g></svg>
      </div>`;
    document.body.appendChild(raiz);
    window.addEventListener(IMPACTO, contar);
    cerrar = initMundoQueResponde(raiz);
  });

  afterEach(() => {
    cerrar();
    window.removeEventListener(IMPACTO, contar);
    raiz.remove();
  });

  it('un click en el fondo golpea, aunque la página entera cuelgue de un tabindex="-1"', () => {
    raiz.querySelector<HTMLElement>('#fondo')!.click();
    expect(golpes).toBe(1);
  });

  it('un click en un control es del control: el fondo no se lo pisa', () => {
    raiz.querySelector<HTMLElement>('#boton')!.click();
    expect(golpes).toBe(0);
  });
});
