import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
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
import {
  LUZ_DE,
  NAVE_DEL_VIAJE,
  TripulacionComponent,
  type QuienDelViaje,
} from '../../components-draw/tripulacion/tripulacion.component';
import { RetratoDeNaveComponent } from '../../components-draw/tripulacion/retrato-de-nave.component';
import { palabrasDeLinea } from '../../libs/guion';
import {
  type FotoDelCarrito,
  GUION_DEL_CARRITO,
  type MomentoDelCarrito,
  momentoDelCarrito,
} from './guion-del-carrito';

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

type Caja = Pick<DOMRect, 'left' | 'right' | 'top' | 'height'>;

/**
 * La flecha de un fragmento de código a lo que maneja, o `null` si no hay por dónde dibujarla. Solo
 * tiene sentido con el carrito y el código lado a lado, y eso se mira donde quedaron, no en un ancho
 * de pantalla: el corte lo decide el CSS, y copiado acá ya se había desfasado 40 px. El Reto vive
 * arriba del código, en su misma columna: su flecha sube por el pasillo y le entra por la izquierda.
 */
export function trazoDelEnlace(codigo: Caja, parte: Caja, carrito: Caja): string | null {
  if (codigo.left < carrito.right) return null;
  const cx = codigo.left;
  const cy = codigo.top + codigo.height / 2;
  const py = parte.top + parte.height / 2;
  if (parte.right <= codigo.left) {
    const px = parte.right + 6;
    const dx = Math.max(36, (cx - px) * 0.5);
    return `M ${cx} ${cy} C ${cx - dx} ${cy} ${px + dx} ${py} ${px} ${py}`;
  }
  const px = parte.left - 6;
  // La panza de la curva no pasa del pasillo: más ancha, se montaba sobre el carrito.
  const dx = Math.min(36, Math.max(12, parte.left - carrito.right));
  return `M ${cx} ${cy} C ${cx - dx} ${cy} ${px - dx} ${py} ${px} ${py}`;
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
  imports: [RouterLink, DecimalPipe, TripulacionComponent, RetratoDeNaveComponent],
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
  readonly count = computed(() => itemCount(this.catalog, this.qty()));
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

  // ── La tripulación que comenta ──────────────────────────────────────────────
  private readonly tripulacion = viewChild(TripulacionComponent);
  /** Lo último que dijo la tripulación: llega diciendo qué se toca, y después comenta lo derivado. */
  readonly linea = signal(GUION_DEL_CARRITO.llegada);
  protected readonly palabrasDeLinea = palabrasDeLinea;
  protected readonly naveDe = (quien: QuienDelViaje): number => NAVE_DEL_VIAJE[quien];
  protected readonly luzDe = (quien: QuienDelViaje): string => LUZ_DE[quien];
  protected nombreDeNave(quien: QuienDelViaje): string {
    return quien === 'cap' ? 'Capitán' : quien === 'naveA' ? 'Nave A' : 'Nave B';
  }

  constructor() {
    const saved = readSaved();
    if (saved) {
      this.qty.set(saved.qty);
      this.coupon.set(saved.coupon);
    }
    // El carrito se guarda solo: el effect reacciona a qty y coupon.
    effect(() => writeSaved({ qty: this.qty(), coupon: this.coupon() }));

    // La charla también se deriva: compara lo que se ve ahora con lo de antes y dice qué cambió.
    let antes: FotoDelCarrito | null = null;
    effect(() => {
      const ahora: FotoDelCarrito = {
        unidades: this.count(),
        cupon: this.coupon(),
        envioGratis: this.freeShipping(),
      };
      const momento = antes && momentoDelCarrito(antes, ahora);
      antes = ahora;
      if (momento) untracked(() => this.decir(momento));
    });

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

  private decir(momento: MomentoDelCarrito): void {
    const linea = GUION_DEL_CARRITO[momento];
    this.linea.set(linea);
    const tripulacion = this.tripulacion();
    tripulacion?.hablar(linea.quien);
    if (momento === 'envio') tripulacion?.festejar();
    else tripulacion?.avisarAlObjeto();
  }

  /** Las naves miran adonde va el puntero, y se enteran de lo que se toca. */
  mirar(e: PointerEvent): void {
    this.tripulacion()?.mirar(e.clientX, e.clientY);
  }
  tocar(e: PointerEvent): void {
    this.tripulacion()?.seTocoAlgo(e.clientX, e.clientY);
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
    const codeEl = this.host.querySelector<HTMLElement>(`[data-code="${key}"]`);
    const partEl = this.host.querySelector<HTMLElement>(`[data-part="${key}"]`);
    const carrito = this.host.querySelector<HTMLElement>('.cart');
    const path =
      codeEl && partEl && carrito
        ? trazoDelEnlace(
            codeEl.getBoundingClientRect(),
            partEl.getBoundingClientRect(),
            carrito.getBoundingClientRect(),
          )
        : null;
    this.wire.set(path ? { path, color: wireColorFor(key) } : null);
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

/**
 * `qty` cruza un boundary externo (localStorage es mutable a mano): validamos que
 * cada cantidad sea un entero no negativo antes de confiar en ella. Sin esto, un `qty`
 * editado a strings propaga `NaN` al subtotal. No validamos las claves contra el
 * catálogo: una clave de más se ignora sola (`subtotal` recorre el catálogo).
 *
 * Pedir entero y >= 0, y no solo finito, es lo que hace que el estado guardado y el que se puede
 * alcanzar tocando la UI sean el mismo conjunto: con -3 guardado a mano, la lista mostraba -3
 * mientras la matemática lo clampeaba a 0, así que el total no se correspondía con lo que se veía.
 */
function isValidQuantities(value: unknown): value is Quantities {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0,
  );
}

function readSaved(): Saved | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { qty, coupon } = parsed as { qty?: unknown; coupon?: unknown };
    if (!isValidQuantities(qty)) return null;
    return { qty, coupon: Boolean(coupon) };
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
