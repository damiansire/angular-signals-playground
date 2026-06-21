import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BenchFrameComponent } from '../../bench-frame/bench-frame.component';

/**
 * Plan de tokens — INSTRUMENTO 03 · CELDAS REACTIVAS (planilla)  →  concepto: computed()
 * --------------------------------------------------------------------------
 * Concepto / nivel: computed() — celda derivada que se recalcula sola al
 *      cambiar sus dependencias. Nivel: derivación / cascada.
 * Ejemplo / dominio: FINANZAS. Una línea de factura de exportación: se carga
 *      cantidad, precio unitario en ARS, descuento, IVA y el tipo de cambio
 *      USD/ARS; la planilla deriva en cascada el subtotal, el neto con
 *      descuento, el total con IVA y el TOTAL en USD.
 *      (No es `fullName = firstName + surname` ni un "counter": es una planilla
 *      financiera real con una cadena de dependencias de 4 eslabones.)
 * Instrumento: Celdas reactivas (planilla) — el mapa por defecto para
 *      computed(): una celda con fórmula que se recalcula al cambiar su origen.
 * Paleta (derivada del sustrato, ficha de PAPEL sobre el banco grafito):
 *      --cell-paper (ficha) · --cell-source-bg/-ink (celdas fuente, ámbar) ·
 *      --cell-derived-bg/-ink/-border (celdas derivadas, jade) ·
 *      --accent-source / --accent-derived (acentos semánticos).
 * Tipos: Archivo (encabezados/etiquetas) + JetBrains Mono (valores y fórmulas).
 * ELEMENTO FIRMA: el RECÁLCULO EN CASCADA VISIBLE — al editar una celda fuente,
 *      las derivadas destellan en cadena, una tras otra (delay escalonado por
 *      profundidad), siguiendo --propagation-duration/-ease. El destello NO usa
 *      effect: se reinicia con un track-key en @for que fuerza re-render de la
 *      fila al cambiar su valor. prefers-reduced-motion lo apaga.
 * Interacción (qué es qué):
 *      - signal:   qty, unitPriceArs, discountPct, ivaPct, fxRate (celdas fuente
 *                  editables; el ÚNICO estado real).
 *      - computed: subtotal → netAfterDiscount → withIva → totalUsd. Cadena de
 *                  derivados; NUNCA se asignan, se recalculan solos en cascada.
 *      - effect:   ninguno (anti-patrón para derivar). El destello sale del
 *                  re-render por track, no de un effect que sincroniza estado.
 *
 * Wireframe ASCII:
 *   ┌── ficha de papel sobre el banco ─────────────────────────────┐
 *   │  fx  =B5*C5            [ recalculado ]   ← barra de fórmula    │
 *   │  ┌────┬───────────────┬──────────┬──────────┐                 │
 *   │  │    │      A        │    B     │    C      │  ← encabezados   │
 *   │  ├────┼───────────────┼──────────┼──────────┤                 │
 *   │  │ 1  │ cantidad      │ [ 120 ]  │  unidad   │  fuente (ámbar)  │
 *   │  │ 2  │ precio ARS    │ [ 8500 ] │  $/u      │  fuente          │
 *   │  │ 3  │ descuento     │ [ 12 ]   │  %        │  fuente          │
 *   │  │ 4  │ IVA           │ [ 21 ]   │  %        │  fuente          │
 *   │  │ 5  │ USD/ARS       │ [ 985 ]  │  tc       │  fuente          │
 *   │  ├────┼───────────────┼──────────┼──────────┤                 │
 *   │  │ 6  │ subtotal      │ ▓ 1.02M  │ =B1*B2    │  derivado (jade) │
 *   │  │ 7  │ neto c/desc.  │ ▓  897K  │ =B6*(1-…) │  derivado ↯      │
 *   │  │ 8  │ total c/IVA   │ ▓ 1.08M  │ =B7*(1+…) │  derivado ↯↯     │
 *   │  │ 9  │ TOTAL USD     │ ▓ 1.103K │ =B8/B5    │  derivado ↯↯↯    │
 *   │  └────┴───────────────┴──────────┴──────────┘                 │
 *   └───────────────────────────────────────────────────────────────┘
 * --------------------------------------------------------------------------
 */

/** Una celda derivada lista para renderizar en la grilla. */
interface DerivedRow {
  readonly ref: string; // B6..B9
  readonly label: string; // nombre legible
  readonly formula: string; // =B1*B2 …
  readonly depth: number; // profundidad en la cascada (0 = primero)
  readonly raw: number; // valor numérico
  readonly display: string; // valor formateado
  /** Key de animación: cambia con el valor → reinicia el destello vía track. */
  readonly flash: string;
}

@Component({
  selector: 'app-reactive-cells',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BenchFrameComponent],
  templateUrl: './reactive-cells.component.html',
  styleUrl: './reactive-cells.component.css',
})
export class ReactiveCellsComponent {
  // ── Celdas FUENTE: el único estado real (signal). Editar = .set(). ──
  /** B1 · cantidad de unidades exportadas. */
  qty = signal(120);
  /** B2 · precio unitario en pesos. */
  unitPriceArs = signal(8500);
  /** B3 · descuento comercial (%). */
  discountPct = signal(12);
  /** B4 · IVA (%). */
  ivaPct = signal(21);
  /** B5 · tipo de cambio USD/ARS. */
  fxRate = signal(985);

  // ── Celdas DERIVADAS: computed en cascada. NUNCA se asignan. ──
  /** B6 = B1 * B2 */
  private subtotal = computed(() => this.qty() * this.unitPriceArs());
  /** B7 = B6 * (1 - B3/100) */
  private netAfterDiscount = computed(() => this.subtotal() * (1 - this.discountPct() / 100));
  /** B8 = B7 * (1 + B4/100) */
  private withIva = computed(() => this.netAfterDiscount() * (1 + this.ivaPct() / 100));
  /** B9 = B8 / B5 */
  private totalUsd = computed(() => this.withIva() / this.fxRate());

  /**
   * La grilla derivada, también como computed: cada vez que una fuente cambia,
   * esta lista se reconstruye y sus `flash` keys cambian → el @for re-renderiza
   * solo las filas afectadas y reinicia su animación de destello. Sin effect.
   */
  derived = computed<DerivedRow[]>(() => {
    const subtotal = this.subtotal();
    const net = this.netAfterDiscount();
    const iva = this.withIva();
    const usd = this.totalUsd();
    return [
      this.row('B6', 'subtotal', '=B1*B2', 0, subtotal, this.ars(subtotal)),
      this.row('B7', 'neto c/descuento', '=B6*(1-B3/100)', 1, net, this.ars(net)),
      this.row('B8', 'total c/IVA', '=B7*(1+B4/100)', 2, iva, this.ars(iva)),
      this.row('B9', 'TOTAL en USD', '=B8/B5', 3, usd, this.usd(usd)),
    ];
  });

  /** Total destacado (la salida final de la cadena), también derivado. */
  totalLabel = computed(() => this.usd(this.totalUsd()));

  private row(
    ref: string,
    label: string,
    formula: string,
    depth: number,
    raw: number,
    display: string,
  ): DerivedRow {
    // flash combina ref + valor redondeado: cambia solo si el valor cambió.
    return { ref, label, formula, depth, raw, display, flash: `${ref}:${Math.round(raw)}` };
  }

  // ── setters de las celdas fuente (input editable → .set()) ──
  setQty(v: string) {
    this.qty.set(this.clamp(v, 0, 1_000_000));
  }
  setUnitPrice(v: string) {
    this.unitPriceArs.set(this.clamp(v, 0, 100_000_000));
  }
  setDiscount(v: string) {
    this.discountPct.set(this.clamp(v, 0, 100));
  }
  setIva(v: string) {
    this.ivaPct.set(this.clamp(v, 0, 100));
  }
  setFxRate(v: string) {
    this.fxRate.set(this.clamp(v, 1, 100_000));
  }

  private clamp(v: string, lo: number, hi: number): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return lo;
    return Math.min(hi, Math.max(lo, n));
  }

  private ars(n: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);
  }
  private usd(n: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  }
}
