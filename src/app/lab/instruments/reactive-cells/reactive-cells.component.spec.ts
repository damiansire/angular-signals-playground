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
});
