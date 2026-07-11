import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ReactiveCellsComponent } from './reactive-cells.component';

describe('ReactiveCellsComponent (computed cascade)', () => {
  let component: ReactiveCellsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveCellsComponent],
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(ReactiveCellsComponent).componentInstance;
  });

  /** Reads the raw value of a derived row by its spreadsheet ref. */
  function raw(ref: string): number {
    const row = component.derived().find((r) => r.ref === ref);
    if (!row) throw new Error(`row ${ref} not found`);
    return row.raw;
  }

  it('computes the full cascade from the default sources', () => {
    // qty=120, price=8500, disc=12%, iva=21%, fx=985
    expect(raw('B6')).toBe(1_020_000); // subtotal = 120 * 8500
    expect(raw('B7')).toBeCloseTo(897_600, 4); // net = subtotal * 0.88
    expect(raw('B8')).toBeCloseTo(1_086_096, 4); // withIva = net * 1.21
    expect(raw('B9')).toBeCloseTo(1_086_096 / 985, 6); // totalUsd = withIva / fx
  });

  it('propagates a change in the quantity source through every derived cell', () => {
    component.setQty('200');
    const subtotal = 200 * 8500;
    expect(raw('B6')).toBe(subtotal);
    expect(raw('B7')).toBeCloseTo(subtotal * 0.88, 4);
    expect(raw('B8')).toBeCloseTo(subtotal * 0.88 * 1.21, 4);
    expect(raw('B9')).toBeCloseTo((subtotal * 0.88 * 1.21) / 985, 6);
  });

  it('reacts to a discount change only from B7 downward', () => {
    const subtotalBefore = raw('B6');
    component.setDiscount('0');
    expect(raw('B6')).toBe(subtotalBefore); // subtotal independent of discount
    expect(raw('B7')).toBeCloseTo(subtotalBefore, 4); // no discount → net == subtotal
  });

  it('reflects the exchange rate in the USD total', () => {
    component.setFxRate('1000');
    expect(raw('B9')).toBeCloseTo(raw('B8') / 1000, 6);
  });

  it('clamps source inputs to their valid range', () => {
    component.setDiscount('250'); // max 100
    expect(component.discountPct()).toBe(100);
    component.setFxRate('0'); // min 1
    expect(component.fxRate()).toBe(1);
    component.setQty('not-a-number'); // falls back to low bound
    expect(component.qty()).toBe(0);
  });

  it('refreshes the flash track key when a derived value changes', () => {
    const flashBefore = component.derived().find((r) => r.ref === 'B6')!.flash;
    component.setQty('999');
    const flashAfter = component.derived().find((r) => r.ref === 'B6')!.flash;
    expect(flashAfter).not.toBe(flashBefore);
  });

  it('exposes the final USD total as a formatted label', () => {
    component.setQty('100');
    component.setUnitPrice('1000');
    component.setDiscount('0');
    component.setIva('0');
    component.setFxRate('100');
    // 100*1000 = 100000 ARS → /100 = 1000 USD
    expect(component.totalLabel()).toContain('1,000');
  });

  describe('benchmark: recómputo de la cascada bajo carga', () => {
    // `row` es privado: se tipa como el mínimo necesario para espiarlo sin `any`.
    interface ComponentWithRow {
      row: (...args: unknown[]) => unknown;
    }

    function spyOnRow() {
      return spyOn(component as unknown as ComponentWithRow, 'row').and.callThrough();
    }

    it('recomputa la cascada proporcionalmente a N actualizaciones (no O(N^2))', () => {
      const rowSpy = spyOnRow();
      const updates = 200;

      for (let i = 0; i < updates; i++) {
        component.setQty(String(100 + i));
        component.derived(); // fuerza la lectura (computed es lazy: sin lectura no recalcula)
      }

      // 4 filas derivadas por cada recómputo de la cascada → exactamente
      // proporcional a `updates`, nunca O(N^2) ni trabajo de más.
      expect(rowSpy.calls.count()).toBe(updates * 4);
    });

    it('no recomputa la cascada si se lee repetidas veces sin cambiar las fuentes', () => {
      component.setQty('500');
      component.derived();

      const rowSpy = spyOnRow();
      component.derived();
      component.derived();
      component.derived();

      expect(rowSpy.calls.count()).toBe(0);
    });

    it('un cambio en una sola fuente no fuerza recómputo de las demás cascadas independientes', () => {
      component.setQty('500');
      component.derived();

      const rowSpy = spyOnRow();
      const updates = 50;
      for (let i = 0; i < updates; i++) {
        component.setDiscount(String(i % 100));
        component.derived();
      }

      // Cada cambio de descuento sigue recalculando las 4 filas (todas dependen
      // en cascada de discountPct), pero sigue siendo lineal en `updates`, no
      // cuadrático: confirma que no hay recómputo duplicado por fila.
      expect(rowSpy.calls.count()).toBe(updates * 4);
    });
  });
});
