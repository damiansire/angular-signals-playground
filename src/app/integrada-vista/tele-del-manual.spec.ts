import { SE_APAGA, SE_PRENDE, apagarLaTele, encenderLaTele } from './tele-del-manual';

describe('la tele del manual', () => {
  const funciones = (k: Keyframe) => String(k['filter']).replace(/\([^)]*\)/g, '');

  describe('avisa cuándo tapa lo de atrás', () => {
    let escenario: HTMLElement;
    let negro: HTMLElement;
    let hoja: HTMLElement;

    // Reloj falso: prender la pantalla deja timers que, sueltos, piden cuadros en medio de otro spec.
    beforeEach(() => {
      jasmine.clock().install();
      escenario = document.body.appendChild(document.createElement('div'));
      negro = escenario.appendChild(document.createElement('div'));
      negro.className = 'prologo__tele';
      hoja = escenario.appendChild(document.createElement('section'));
    });
    afterEach(() => {
      jasmine.clock().uninstall();
      escenario.remove();
    });

    const conMovimiento = (hay: boolean) =>
      spyOn(window, 'matchMedia').and.returnValue({ matches: !hay } as MediaQueryList);
    /** Una animación terminada o cancelada avisa por promesa: se le da lugar sin esperar al reloj. */
    const asentar = async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    };
    const terminar = async (el: HTMLElement) => {
      el.getAnimations().forEach((a) => a.finish());
      await asentar();
    };

    it('al prenderse, recién cuando el negro terminó de subir', async () => {
      conMovimiento(true);
      const alQuedarNegro = jasmine.createSpy('alQuedarNegro');
      encenderLaTele(hoja, null, alQuedarNegro);
      expect(alQuedarNegro).not.toHaveBeenCalled();

      await terminar(negro);
      expect(alQuedarNegro).toHaveBeenCalledTimes(1);
    });

    it('si la hoja se va antes de que el negro suba, no avisa', async () => {
      conMovimiento(true);
      const alQuedarNegro = jasmine.createSpy('alQuedarNegro');
      encenderLaTele(hoja, null, alQuedarNegro);

      negro.getAnimations().forEach((a) => a.cancel());
      await asentar();
      expect(alQuedarNegro).not.toHaveBeenCalled();
    });

    it('sin movimiento el negro está desde el principio, y avisa enseguida', () => {
      conMovimiento(false);
      const alQuedarNegro = jasmine.createSpy('alQuedarNegro');
      encenderLaTele(hoja, null, alQuedarNegro);
      expect(alQuedarNegro).toHaveBeenCalledTimes(1);
    });

    it('al apagarse, con la pantalla ya apagada y antes de que el negro se vaya', async () => {
      conMovimiento(true);
      const alVolver = jasmine.createSpy('alVolver');
      const apagada = apagarLaTele(hoja, alVolver);
      expect(alVolver).not.toHaveBeenCalled();

      await terminar(hoja);
      expect(alVolver).toHaveBeenCalledTimes(1);
      expect(negro.getAnimations().length).withContext('el negro todavía se está yendo').toBe(1);

      await terminar(negro);
      await apagada;
    });
  });

  it('se prende desde nada y termina en la imagen tal cual', () => {
    expect(SE_PRENDE[0]['clipPath']).toBe('inset(50.00% 50.00%)');
    expect(SE_PRENDE.at(-1)).toEqual(
      jasmine.objectContaining({ clipPath: 'inset(0.00% 0.00%)', filter: 'brightness(1)' }),
    );
  });

  it('se apaga desde la imagen tal cual y no deja nada', () => {
    expect(SE_APAGA[0]).toEqual(
      jasmine.objectContaining({ clipPath: 'inset(0.00% 0.00%)', filter: 'brightness(1)' }),
    );
    expect(SE_APAGA.at(-1)?.['clipPath']).toBe('inset(50.00% 50.00%)');
  });

  it('recorta y no achica: ningún cuadro toca la geometría de la página', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      expect(cuadros.some((k) => 'transform' in k || 'scale' in k)).toBeFalse();
    }
  });

  it('cada cuadro filtra con las mismas funciones, así el blanco se interpola', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      expect(new Set(cuadros.map(funciones))).toEqual(new Set(['brightness']));
    }
  });

  it('los cuadros avanzan de 0 a 1', () => {
    for (const cuadros of [SE_PRENDE, SE_APAGA]) {
      const offsets = cuadros.map((k) => k.offset as number);
      expect(offsets[0]).toBe(0);
      expect(offsets.at(-1)).toBe(1);
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    }
  });
});
