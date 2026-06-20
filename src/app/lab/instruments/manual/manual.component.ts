import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { BenchFrameComponent } from '../../bench-frame/bench-frame.component';

/**
 * Plan de tokens — INSTRUMENTO 04 · MANUAL TÉCNICO (editorial) → concepto: el grafo / glitch-free
 * --------------------------------------------------------------------------
 * Concepto / gotcha: EL DIAMANTE DE DEPENDENCIAS y la garantía glitch-free.
 *      Una fuente `n` alimenta a DOS computeds (`square`, `half`); un tercero
 *      (`report`) depende de los dos. La intuición "ingenua" teme que `report`
 *      se evalúe en un estado intermedio (uno de los dos brazos ya actualizado,
 *      el otro todavía viejo) → un "glitch". Signals garantiza que NO: `report`
 *      se recalcula UNA sola vez, recién cuando ambos brazos están consistentes.
 *      Se cuenta mejor con prosa + un diagrama del grafo que con manipulación.
 * Instrumento: Manual técnico — momento de modelo mental, no de perillas.
 * Paleta: --manual-paper (ficha), --manual-ink (display), --manual-prose (cuerpo),
 *      --manual-oxblood (acento editorial / kicker / iniciales), nodos del grafo
 *      en --accent-source (fuente ámbar) y --accent-derived (derivados jade).
 * Tipos: Fraunces (var(--font-editorial)) para kicker/título/cuerpo editorial;
 *      JetBrains Mono (var(--font-mono)) para el código del margen y los valores.
 * ELEMENTO FIRMA: el VALOR EN VIVO embebido en la oración corriente. Movés la
 *      fuente `n` y el número derivado `report` aparece dentro del párrafo,
 *      mientras el diagrama resalta la propagación n → (square, half) → report.
 * Interacción (qué es qué):
 *      - signal:   n            → la fuente editable (única pieza de estado real).
 *      - computed: square, half → los dos brazos del diamante.
 *      - computed: report       → el vértice que une los brazos (read-only, jamás se asigna).
 *      - effect:   cuenta (logging) las re-evaluaciones de `report`; sube de a UNO
 *                                 por cambio = prueba visible del glitch-free. El conteo
 *                                 vive en `evals` (signal), no en un computed impuro.
 * Wireframe ASCII:
 *      ┌───────── ficha de papel ───────────────────────────┐
 *      │ § 04 · EL GRAFO                          ●○○ lección │
 *      │ El diamante de                                       │
 *      │ dependencias            ┌── código margen ──┐        │
 *      │ ─────────────           │ n      = signal() │        │
 *      │ Prosa a una columna     │ square = computed │        │
 *      │ con el [valor=64] vivo  │ half   = computed │        │
 *      │ embebido en la oración. │ report = computed │        │
 *      │                         └───────────────────┘        │
 *      │   [ control fuente n ──●──────── 8 ]                  │
 *      │            (n) ──▶ (square)                           │
 *      │             └───▶ (half) ──┐                          │
 *      │                  (square) ─┴─▶ (report)               │
 *      │   nota al margen: 1 cambio = 1 recálculo de report    │
 *      └──────────────────────────────────────────────────────┘
 * --------------------------------------------------------------------------
 */
@Component({
    selector: 'app-manual',
    imports: [BenchFrameComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './manual.component.html',
    styleUrl: './manual.component.css'
})
export class ManualComponent {
  readonly min = 1;
  readonly max = 12;

  /** La fuente: el único estado real. Mover el control = set() del signal. */
  n = signal(8);

  /** Brazo izquierdo del diamante. */
  square = computed(() => this.n() * this.n());
  /** Brazo derecho del diamante. */
  half = computed(() => this.n() / 2);
  /** Vértice: une los dos brazos. Read-only — nunca se asigna. `report` queda PURO. */
  report = computed(() => this.square() + this.half());

  /**
   * Prueba glitch-free con un effect VÁLIDO (logging): cada vez que `report`
   * cambia, el effect corre UNA sola vez y incrementa el contador. El conteo
   * vive en este signal `evals` (no contamina al computed, que sigue puro).
   * Como el grafo es glitch-free, sube exactamente de a uno por cambio de `n`,
   * jamás dos veces (que sería el glitch del estado intermedio).
   */
  evals = signal(0);

  /**
   * Conteo mostrado: el effect corre una vez en la inicialización (que no es un
   * "cambio"), así que descontamos esa corrida. Al cargar muestra 0 y sube de a
   * uno por cada cambio real de la fuente.
   */
  shownEvals = computed(() => Math.max(0, this.evals() - 1));

  /** Posición 0..1 de la fuente para resaltar la propagación en el diagrama. */
  flow = computed(() => (this.n() - this.min) / (this.max - this.min));

  constructor() {
    effect(
      () => {
        this.report(); // única dependencia: cuenta re-evaluaciones del vértice
        this.evals.update((n) => n + 1);
      }
    );
  }

  setN(value: string) {
    this.n.set(Number(value));
  }
}
