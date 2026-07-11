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
  private readonly pulseT = signal(0); // 0..1 a lo largo de src→der→eff
  readonly pulseActive = signal(false);
  readonly effectFlash = signal(false);
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Posición del punto de pulso interpolada sobre la polilínea del grafo. */
  readonly pulsePos = computed<Pt>(() => {
    const t = this.pulseT();
    if (t <= this.split) {
      return lerp(this.src, this.der, this.split === 0 ? 0 : t / this.split);
    }
    return lerp(this.der, this.eff, (t - this.split) / (1 - this.split));
  });

  private rafId = 0;

  constructor() {
    // El efecto es real: reacciona a `doubled` y cuenta sus corridas.
    effect(() => {
      this.doubled();
      this.effectRuns.update((n) => n + 1);
    });
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.rafId));
  }

  /** Cambia la fuente y dispara la coreografía visual de propagación. */
  bump(delta: number): void {
    this.count.update((n) => clamp(n + delta, 0, 20));
    this.animatePulse();
  }

  reset(): void {
    this.count.set(3);
    this.animatePulse();
  }

  private animatePulse(): void {
    cancelAnimationFrame(this.rafId);
    if (this.reduceMotion) {
      this.pulseActive.set(false);
      this.fireEffectFlash();
      return;
    }
    const duration = 720;
    let start = 0;
    this.pulseActive.set(true);
    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      this.pulseT.set(t);
      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.pulseActive.set(false);
        this.fireEffectFlash();
      }
    };
    this.rafId = requestAnimationFrame(step);
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
