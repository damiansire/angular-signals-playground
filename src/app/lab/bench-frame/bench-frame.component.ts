import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Plan de tokens — SHELL "banco de laboratorio"
 * --------------------------------------------------------------------------
 * Rol: sustrato compartido que enmarca CUALQUIER instrumento (patchbay,
 *      osciloscopio, celdas, manual) para que las cuatro estéticas se sientan
 *      un solo producto.
 * Paleta: --bench-graphite / --bench-graphite-2 (panel), --sf-silk (serigrafía).
 * Motivo de unidad: tornillos en las 4 esquinas + grilla hairline + el acento
 *      semántico del concepto (ámbar/jade/rojo) en el riel superior.
 * Tipos: Archivo (etiquetas) + JetBrains Mono (concepto/valores).
 * --------------------------------------------------------------------------
 */
type Accent = 'source' | 'derived' | 'effect';

@Component({
    selector: 'app-bench-frame',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './bench-frame.component.html',
    styleUrl: './bench-frame.component.css'
})
export class BenchFrameComponent {
  /** Número de instrumento en el riel (ej. "01"). */
  instrument = input('01');
  /** Nombre del instrumento (ej. "Patchbay"). */
  name = input('Instrument');
  /** Concepto de Signals que encarna (ej. "signal()"). */
  concept = input('signal()');
  /** Acento semántico: define el punto de color del riel. */
  accent = input<Accent>('source');
}
