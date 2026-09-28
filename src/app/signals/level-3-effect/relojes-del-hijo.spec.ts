import { DestroyRef } from '@angular/core';
import { RelojesDelHijo } from './relojes-del-hijo';

describe('RelojesDelHijo', () => {
  // Un DestroyRef de mentira: el test decide cuándo "se va" el padre.
  let irse: () => void;
  const padre: Pick<DestroyRef, 'onDestroy'> = {
    onDestroy: (callback) => {
      irse = callback;
      return () => undefined;
    },
  };

  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('cada latido suma al total y queda en el historial con su hora HH:mm:ss', () => {
    const relojes = new RelojesDelHijo(padre);
    relojes.latir(new Date(2024, 0, 1, 9, 5, 7));

    expect(relojes.latidos()).toBe(1);
    expect(relojes.historial().map((h) => [h.trigger, h.newState])).toEqual([['09:05:07', 1]]);
  });

  it('el historial se topea en los últimos 5 pero el total sigue subiendo', () => {
    const relojes = new RelojesDelHijo(padre);
    for (let i = 0; i < 8; i++) relojes.latir(new Date());

    expect(relojes.latidos()).toBe(8);
    expect(relojes.historial().map((h) => h.newState)).toEqual([4, 5, 6, 7, 8]);
  });

  it('cuando el padre se va, apaga los intervalos que el hijo dejó latiendo', () => {
    const relojes = new RelojesDelHijo(padre);
    relojes.registrar(setInterval(() => relojes.latir(new Date()), 1000));
    jasmine.clock().tick(2000);
    expect(relojes.latidos()).toBe(2);

    irse();
    jasmine.clock().tick(5000);
    expect(relojes.latidos()).toBe(2);
  });
});
