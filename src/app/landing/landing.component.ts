import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Landing viva: el hero no ILUSTRA un signal, ES uno.
 * `count` (fuente), `doubled` (computed) y un `effect()` real manejan el grafo
 * de círculos. Tocás la moneda ámbar y ves la propagación cascar hasta el
 * efecto rojo. La animación del pulso es una capa puramente visual encima del
 * grafo reactivo real; el estado (count/doubled/veces) es de verdad.
 */
interface Pt {
  x: number;
  y: number;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly destroyRef = inject(DestroyRef);

  /** Los 12 niveles como susurro del viaje (cinta de puntos 0 → 11). */
  readonly trail = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // ── Grafo reactivo REAL ────────────────────────────────────────────────────
  readonly count = signal(3);
  readonly doubled = computed(() => this.count() * 2);
  /** Cuántas veces corrió el efecto (incluye la corrida inicial de `effect`). */
  readonly effectRuns = signal(0);

  // ── Geometría del grafo (coordenadas del viewBox 0 0 720 460) ───────────────
  readonly src: Pt = { x: 156, y: 258 };
  readonly der: Pt = { x: 430, y: 148 };
  readonly eff: Pt = { x: 566, y: 336 };
  readonly coinR = 60;

  // Longitud relativa de cada tramo, para repartir el barrido del pulso 0..1.
  private readonly len1 = dist(this.src, this.der);
  private readonly len2 = dist(this.der, this.eff);
  private readonly split = this.len1 / (this.len1 + this.len2);

  // ── Capa visual del pulso ───────────────────────────────────────────────────
  // Cada cambio de la fuente larga una "pelota" que viaja src→der→eff. Se admiten
  // VARIAS a la vez (clicks rápidos = flujo continuo) en vez de reiniciar una sola.
  readonly effectFlash = signal(false);
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readonly pulseList = signal<{ id: number; start: number; t: number }[]>([]);
  /** Posición (id + x/y) de cada pulso activo, interpolada sobre la polilínea del grafo. */
  readonly pulsePoints = computed<{ id: number; x: number; y: number }[]>(() =>
    this.pulseList().map((p) => {
      const pt = this.posAt(p.t);
      return { id: p.id, x: pt.x, y: pt.y };
    }),
  );

  private pulseId = 0;
  private running = false;
  private rafId = 0;

  constructor() {
    // El efecto es real: reacciona a `doubled` y cuenta sus corridas.
    effect(() => {
      this.doubled();
      this.effectRuns.update((n) => n + 1);
    });
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.rafId));
  }

  /** Cambia la fuente y larga una pelota nueva por la propagación. */
  bump(delta: number): void {
    this.count.update((n) => clamp(n + delta, 0, 20));
    this.spawnPulse();
  }

  reset(): void {
    this.count.set(3);
    this.spawnPulse();
  }

  private posAt(t: number): Pt {
    if (t <= this.split) {
      return lerp(this.src, this.der, this.split === 0 ? 0 : t / this.split);
    }
    return lerp(this.der, this.eff, (t - this.split) / (1 - this.split));
  }

  private spawnPulse(): void {
    if (this.reduceMotion) {
      this.fireEffectFlash();
      return;
    }
    this.pulseList.update((list) => [...list, { id: this.pulseId++, start: 0, t: 0 }]);
    if (!this.running) {
      this.running = true;
      this.rafId = requestAnimationFrame((now) => this.tick(now));
    }
  }

  private tick(now: number): void {
    const duration = 720;
    let reachedEnd = false;
    const next = this.pulseList()
      .map((p) => {
        const start = p.start || now;
        return { id: p.id, start, t: Math.min(1, (now - start) / duration) };
      })
      .filter((p) => {
        if (p.t >= 1) {
          reachedEnd = true;
          return false;
        }
        return true;
      });
    this.pulseList.set(next);
    if (reachedEnd) this.fireEffectFlash();
    if (next.length > 0) {
      this.rafId = requestAnimationFrame((n) => this.tick(n));
    } else {
      this.running = false;
    }
  }

  private fireEffectFlash(): void {
    this.effectFlash.set(true);
    setTimeout(() => this.effectFlash.set(false), 420);
  }
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
