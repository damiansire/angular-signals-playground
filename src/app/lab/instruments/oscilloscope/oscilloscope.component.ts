import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { BenchFrameComponent } from '../../bench-frame/bench-frame.component';

/**
 * Plan de tokens — INSTRUMENTO 02 · OSCILOSCOPIO (CRT)  →  concepto: effect()
 * --------------------------------------------------------------------------
 * Concepto / nivel: effect() — un side-effect imperativo que dispara y se
 *      "mide" en CADA cambio. Nivel: efectos.
 * Ejemplo / dominio: TRANSPORTE. Telemetría de un tren: el operador mueve el
 *      throttle y `speed = signal(...)` km/h cambia. (signal-flow usó AUDIO,
 *      las celdas usarán FINANZAS → acá transporte, sin solaparse. No es
 *      "counter": es la lectura de un sensor de velocidad real.)
 * Instrumento: Osciloscopio — el mapa por defecto de effect(): algo dispara y
 *      se mide en cada cambio; la traza reacciona.
 * Paleta (toda del :root global, sin tocar styles.css):
 *      --scope-phosphor (CH1, la traza) · --scope-bg · --scope-grid (graticula)
 *      · --scope-ch2 ámbar (umbral CH2) · --accent-effect rojo (el latido del
 *      effect al dispararse).
 * Tipos: Archivo (etiquetas) + JetBrains Mono (lecturas y log).
 * ELEMENTO FIRMA: la traza verde fósforo que SALTA a una nueva altura en cada
 *      set() del signal, con scanlines, graticula y glow CRT. Todo lo demás callado.
 * Interacción (qué es qué):
 *      - signal:   speed                  → la lectura editable (la fuente real).
 *      - computed: traceY / tracePath /   → derivados que dibujan la traza y la
 *                  band                      banda de régimen. NO disparan efectos.
 *      - effect:   side-effect imperativo → en cada cambio: append al log de
 *                  telemetría en pantalla y ++runs. (El log on-screen es el
 *                  side-effect de logging válido que demuestra el effect.)
 *
 * Wireframe ASCII:
 *   ┌─ INSTR·02 · OSCILLOSCOPE ─────────── effect() ──┐
 *   │  ┌──────────CRT──────────┐   ┌─ EFFECT LOG ───┐ │
 *   │  │ ····graticula···· CH1 │   │ runs: 014      │ │
 *   │  │ ╱╲___ trace SALTA ____│   │ ▸ 88 km/h →log │ │
 *   │  │ ········· CH2 thresh   │   │ ▸ 92 km/h →ttl │ │
 *   │  │ [CH1 92km/h][CH2 80]  │   │ ▸ ...          │ │
 *   │  └───────────────────────┘   └────────────────┘ │
 *   │  throttle ▭▭▭▭▭▭●▭▭▭   set(speed)               │
 *   └──────────────────────────────────────────────────┘
 * --------------------------------------------------------------------------
 */

interface LogEntry {
  readonly run: number;
  readonly speed: number;
  readonly sink: 'log';
  readonly stamp: string;
}

@Component({
  selector: 'app-oscilloscope',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BenchFrameComponent],
  templateUrl: './oscilloscope.component.html',
  styleUrl: './oscilloscope.component.css',
})
export class OscilloscopeComponent {
  /** Rango del sensor de velocidad (km/h). */
  readonly min = 0;
  readonly max = 320;
  /** Umbral de régimen (CH2): por encima, el tren entra en alta velocidad. */
  readonly threshold = 200;

  /** Geometría de la pantalla CRT (unidades del viewBox). */
  private readonly w = 320;
  private readonly h = 180;
  private readonly pad = 12;

  /** Líneas de la graticula (posiciones fijas, solo decorativas). */
  readonly cols = [60, 110, 160, 210, 260];
  readonly rows = [42, 78, 114, 150];

  /** La fuente: el ÚNICO estado de control real. Throttle → set(speed). */
  speed = signal(120);

  /** Derivados puros: dibujan la traza. No tienen side-effects. */
  private norm = computed(() => (this.speed() - this.min) / (this.max - this.min));

  /** Altura de la traza dentro del CRT (más rápido = más arriba). */
  traceY = computed(() => {
    const top = this.pad;
    const bottom = this.h - this.pad;
    return bottom - this.norm() * (bottom - top);
  });

  /** Línea de umbral CH2 (ámbar), en coords del CRT. */
  thresholdY = computed(() => {
    const t = (this.threshold - this.min) / (this.max - this.min);
    const top = this.pad;
    const bottom = this.h - this.pad;
    return bottom - t * (bottom - top);
  });

  /** Onda de la traza: una senoidal cuya amplitud crece con la velocidad. */
  tracePath = computed(() => {
    const y = this.traceY();
    const amp = 4 + this.norm() * 22;
    const cycles = 3;
    const steps = 64;
    const x0 = this.pad;
    const x1 = this.w - this.pad;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const x = x0 + p * (x1 - x0);
      const yy = y - Math.sin(p * Math.PI * 2 * cycles) * amp;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)} `;
    }
    return d.trim();
  });

  /** Etiqueta de régimen, derivada del umbral. */
  band = computed(() => (this.speed() >= this.threshold ? 'OVER' : 'NOMINAL'));

  /** Cuántas veces corrió el effect (lo que la lección quiere hacer visible). */
  runs = signal(0);

  /** Log de telemetría: producido DENTRO del effect (side-effect de logging). */
  log = signal<readonly LogEntry[]>([]);

  constructor() {
    // effect() idiomático: SOLO efectos imperativos. Corre una vez al inicio y
    // luego en CADA cambio de speed(). No deriva estado (eso vive en computed).
    effect(() => {
      const v = this.speed(); // dependencia: re-ejecuta en cada set()
      // runs/log se LEEN con untracked: el effect solo debe depender de speed,
      // no auto-disparase por escribir su propio contador (evita loop infinito).
      const run = untracked(this.runs) + 1;

      // registra la corrida en el log de pantalla (máx 6, más nueva arriba).
      // Este log on-screen es el único side-effect: nada global (sin title ni storage).
      const entry: LogEntry = { run, speed: v, sink: 'log', stamp: stamp() };
      this.runs.set(run);
      this.log.update((rows) => [entry, ...rows].slice(0, 6));
    });
  }

  setSpeed(value: string) {
    this.speed.set(Number(value));
  }

  /** Etiqueta legible del destino del side-effect para el log. */
  sinkLabel(): string {
    return 'telemetry log';
  }
}

/** Marca de tiempo corta y monoespaciada para el log. */
function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
