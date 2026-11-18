import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  hidden,
  max,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { SIGNAL_RULES_SYSTEM } from '../../io-systems';

interface PanelDelRepetidor {
  automatica: boolean;
  frecuencia: number;
  cifrar: boolean;
  clave: string;
}

const FRECUENCIA_MINIMA = 88;
const FRECUENCIA_MAXIMA = 108;

@Component({
  selector: 'app-signal-rules',
  templateUrl: './signal-rules.component.html',
  styleUrl: './signal-rules.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, FormField],
})
export class SignalRulesComponent {
  readonly closingSystem = SIGNAL_RULES_SYSTEM;

  readonly modelo = signal<PanelDelRepetidor>({
    automatica: false,
    frecuencia: 98,
    cifrar: false,
    clave: '',
  });

  readonly panel = form(this.modelo, (r) => {
    min(r.frecuencia, FRECUENCIA_MINIMA);
    max(r.frecuencia, FRECUENCIA_MAXIMA);
    disabled(r.frecuencia, ({ valueOf }) =>
      valueOf(r.automatica) ? 'La elige el repetidor' : false,
    );
    hidden(r.clave, ({ valueOf }) => !valueOf(r.cifrar));
    required(r.clave, { message: 'Falta la clave' });
    // Reads another field, so moving the dial can break or fix a key nobody touched.
    validate(r.clave, ({ value, valueOf }) =>
      value().includes(String(valueOf(r.frecuencia)))
        ? { kind: 'obvia', message: 'Contiene la frecuencia' }
        : undefined,
    );
  });

  readonly alAire = computed(() => this.panel().valid());

  /** A higher frequency is drawn as faster waves, so the dial answers before any text does. */
  readonly cicloDeOnda = computed(() => {
    const avance =
      (this.modelo().frecuencia - FRECUENCIA_MINIMA) / (FRECUENCIA_MAXIMA - FRECUENCIA_MINIMA);
    return `${(2.4 - avance * 1.7).toFixed(2)}s`;
  });

  private readonly erroresDeClave = computed(() =>
    this.panel.clave().hidden() ? [] : this.panel.clave().errors(),
  );

  readonly lines = computed<CodeLine[]>(() => {
    const errores = this.erroresDeClave().map((error) => error.kind);
    return [
      { line: 'panel = form(this.modelo, (r) => {', active: false },
      {
        line: '  disabled(r.frecuencia, (c) => c.valueOf(r.automatica));',
        active: this.panel.frecuencia().disabled(),
      },
      {
        line: '  hidden(r.clave, (c) => !c.valueOf(r.cifrar));',
        active: this.panel.clave().hidden(),
      },
      { line: '  required(r.clave);', active: errores.includes('required') },
      { line: '  validate(r.clave, (c) =>', active: errores.includes('obvia') },
      {
        line: '    c.value().includes(c.valueOf(r.frecuencia))',
        active: errores.includes('obvia'),
      },
      { line: '      ? { kind: "obvia" } : undefined);', active: errores.includes('obvia') },
      { line: '});', active: false },
    ];
  });
}
