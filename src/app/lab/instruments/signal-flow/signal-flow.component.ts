import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BenchFrameComponent } from '../../bench-frame/bench-frame.component';

/**
 * Plan de tokens — INSTRUMENTO 01 · SIGNAL FLOW (patchbay)  →  concepto: signal()
 * --------------------------------------------------------------------------
 * Concepto / nivel: signal() — fuente editable. Nivel introductorio.
 * Ejemplo / dominio: AUDIO. La fuente es la frecuencia de corte de un filtro
 *      de sinte (`cutoff = signal(880)` Hz). Una perilla física = el signal.
 *      (No "counter": es un control real de un dominio concreto.)
 * Instrumento: Signal Flow (patchbay / sinte modular) — el mapa por defecto
 *      para signal(): una fuente editable se encarna como una perilla física.
 * Paleta: panel grafito (--bench-*), serigrafía --sf-silk, cable
 *      --sf-cable-rust → --sf-cable-mustard, LED --sf-led, acento ámbar
 *      --accent-source (= fuente/escritura).
 * Tipos: Archivo (etiquetas) + JetBrains Mono (valores y la línea de código).
 * ELEMENTO FIRMA: el cable bezier que TRANSPORTA el valor con un pulso animado
 *      en cada cambio. Todo lo demás queda disciplinado.
 * Interacción (qué es qué):
 *      - signal:   cutoff           → la perilla/fader editable (la fuente).
 *      - computed: rotation/glow/label → derivados que mueven perilla, LED y lectura.
 *      - handler:  setCutoff dispara el pulso del cable junto al set() (la propagación visible).
 * --------------------------------------------------------------------------
 */
@Component({
  selector: 'app-signal-flow',
  imports: [BenchFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signal-flow.component.html',
  styleUrl: './signal-flow.component.css',
})
export class SignalFlowComponent {
  readonly min = 20;
  readonly max = 18000;

  /** La fuente: el único estado real. Tocar la perilla = set() del signal. */
  cutoff = signal(880);

  /** Derivados solo para la firma visual (perilla, brillo, lectura). */
  private t = computed(() => (this.cutoff() - this.min) / (this.max - this.min));
  rotation = computed(() => -135 + this.t() * 270); // grados de la perilla
  glow = computed(() => 0.25 + this.t() * 0.75); // opacidad/halo del LED
  label = computed(() => {
    const hz = this.cutoff();
    return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${hz} Hz`;
  });

  /** Firma: cada cambio del signal reinicia el pulso que viaja por el cable. */
  private pulse = signal(0);
  pulses = computed(() => [this.pulse()]);

  setCutoff(value: string) {
    this.cutoff.set(Number(value));
    // El pulso es un evento de UI, no estado derivado: se dispara junto al set().
    this.pulse.update((n) => n + 1); // reinicia la animación del cable
  }
}
