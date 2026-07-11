import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Product,
  Quantities,
  discountAmount,
  itemCount,
  lineTotal,
  qualifiesFreeShipping,
  shippingProgress,
  subtotal,
  total,
} from './cart.model';

/**
 * Ejemplo aplicado: usás lo aprendido (signal → computed → effect) en algo real.
 * Las cantidades son la ÚNICA fuente (`signal`); todo lo demás (subtotales,
 * descuento, total, envío gratis) es estado derivado (`computed`), y el carrito
 * se persiste solo con un `effect`, sin ningún lifecycle hook. El reto ("llegá
 * al envío gratis") también es un `computed`: la reactividad se verifica sola.
 */
const STORAGE_KEY = 'signals-carrito';
const FREE_SHIPPING = 12000;

/** Cada fragmento de código se enlaza con la parte del widget que maneja. */
export type LinkKey = 'signal' | 'subtotal' | 'envio' | 'effect';

interface Saved {
  qty: Quantities;
  coupon: boolean;
}

interface Wire {
  path: string;
  color: string;
}

/** Color de la flecha según el rol del fragmento (mismo lenguaje semántico). */
export function wireColorFor(key: LinkKey): string {
  switch (key) {
    case 'signal':
      return '#c97d1e'; // ámbar: fuente
    case 'subtotal':
      return '#2f9a80'; // jade: derivado
    case 'envio':
      return '#2f9a80';
    case 'effect':
      return '#e23b2c'; // rojo: efecto
  }
}

@Component({
  selector: 'app-cart-example',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart-example.component.html',
  styleUrl: './cart-example.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartExampleComponent {
  readonly freeShippingGoal = FREE_SHIPPING;

  readonly catalog: readonly Product[] = [
    { id: 'cafe', name: 'Café de especialidad 250g', price: 4200 },
    { id: 'medialunas', name: 'Medialunas x6', price: 3600 },
    { id: 'filtros', name: 'Filtros V60 x40', price: 2800 },
    { id: 'taza', name: 'Taza cerámica', price: 5400 },
  ];

  // ── La única fuente de verdad ───────────────────────────────────────────────
  readonly qty = signal<Quantities>({ cafe: 1, medialunas: 1 });
  readonly coupon = signal(false);

  // ── Todo lo demás es derivado ───────────────────────────────────────────────
  readonly subtotal = computed(() => subtotal(this.catalog, this.qty()));
  readonly discount = computed(() => discountAmount(this.subtotal(), this.coupon()));
  readonly total = computed(() => total(this.subtotal(), this.discount()));
  readonly count = computed(() => itemCount(this.qty()));
  readonly freeShipping = computed(() => qualifiesFreeShipping(this.subtotal(), FREE_SHIPPING));
  readonly progress = computed(() => shippingProgress(this.subtotal(), FREE_SHIPPING));
  readonly missingForFree = computed(() => Math.max(0, FREE_SHIPPING - this.subtotal()));

  private readonly currency = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  // ── Mapa relacional código ↔ widget ─────────────────────────────────────────
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  /** Fragmento de código activo (hover/focus), o null. */
  readonly linked = signal<LinkKey | null>(null);
  /** Flecha curva que conecta el fragmento activo con su parte del widget. */
  readonly wire = signal<Wire | null>(null);

  constructor() {
    const saved = readSaved();
    if (saved) {
      this.qty.set(saved.qty);
      this.coupon.set(saved.coupon);
    }
    // El carrito se guarda solo: el effect reacciona a qty y coupon.
    effect(() => writeSaved({ qty: this.qty(), coupon: this.coupon() }));

    // Al scrollear o redimensionar, la flecha activa se recalcula.
    if (typeof window !== 'undefined') {
      const redraw = () => {
        const key = this.linked();
        if (key) this.drawWire(key);
      };
      this.host.addEventListener('scroll', redraw, { passive: true });
      window.addEventListener('resize', redraw);
      this.destroyRef.onDestroy(() => {
        this.host.removeEventListener('scroll', redraw);
        window.removeEventListener('resize', redraw);
      });
    }
  }

  /** Enciende el enlace de un fragmento y dibuja su flecha. */
  linkTo(key: LinkKey): void {
    this.linked.set(key);
    this.drawWire(key);
  }
  unlink(): void {
    this.linked.set(null);
    this.wire.set(null);
  }

  private drawWire(key: LinkKey): void {
    // La flecha solo tiene sentido con las dos columnas lado a lado.
    const wideEnough =
      typeof matchMedia !== 'undefined' && matchMedia('(min-width: 760px)').matches;
    const codeEl = this.host.querySelector<HTMLElement>(`[data-code="${key}"]`);
    const partEl = this.host.querySelector<HTMLElement>(`[data-part="${key}"]`);
    if (!wideEnough || !codeEl || !partEl) {
      this.wire.set(null);
      return;
    }
    const c = codeEl.getBoundingClientRect();
    const p = partEl.getBoundingClientRect();
    // Sale del borde izquierdo del código y apunta al borde derecho del widget.
    const cx = c.left;
    const cy = c.top + c.height / 2;
    const px = p.right + 6;
    const py = p.top + p.height / 2;
    const dx = Math.max(36, (cx - px) * 0.5);
    this.wire.set({
      path: `M ${cx} ${cy} C ${cx - dx} ${cy} ${px + dx} ${py} ${px} ${py}`,
      color: wireColorFor(key),
    });
  }

  lineOf(id: string): number {
    return lineTotal(this.priceOf(id), this.qty()[id] ?? 0);
  }
  qtyOf(id: string): number {
    return this.qty()[id] ?? 0;
  }
  money(value: number): string {
    return this.currency.format(value);
  }

  inc(id: string): void {
    this.qty.update((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  }
  dec(id: string): void {
    this.qty.update((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }));
  }
  toggleCoupon(): void {
    this.coupon.update((c) => !c);
  }
  reset(): void {
    this.qty.set({});
    this.coupon.set(false);
  }

  private priceOf(id: string): number {
    return this.catalog.find((p) => p.id === id)?.price ?? 0;
  }
}

function readSaved(): Saved | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (!parsed || typeof parsed.qty !== 'object') return null;
    return { qty: parsed.qty, coupon: Boolean(parsed.coupon) };
  } catch {
    return null;
  }
}

function writeSaved(state: Saved): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Almacenamiento lleno o bloqueado: la demo funciona igual sin persistir.
  }
}
