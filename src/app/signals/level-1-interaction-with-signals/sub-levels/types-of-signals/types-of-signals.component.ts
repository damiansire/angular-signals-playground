import {
  Component,
  computed,
  isSignal,
  isWritableSignal,
  signal,
  ChangeDetectionStrategy,
  Signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

interface SignalKind {
  id: string;
  label: string;
  writable: boolean;
  description: string;
  code: CodeLine[];
}

@Component({
  selector: 'app-types-of-signals',
  imports: [ColumnAndCodeLayoutComponent],
  templateUrl: './types-of-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './types-of-signals.component.css',
})
export class TypesOfSignalsComponent {
  readonly kinds: SignalKind[] = [
    {
      id: 'writable',
      label: 'WritableSignal',
      writable: true,
      description: 'Se crea con signal(). Podés leerlo y escribirlo con set() / update().',
      code: [
        { line: 'count = signal(0);', active: true },
        { line: 'count.set(5);', active: false },
        { line: 'count.update((c) => c + 1);', active: false },
      ],
    },
    {
      id: 'readonly',
      label: 'Signal (solo lectura)',
      writable: false,
      description: 'Un Signal<T> sin set/update. Se obtiene con asReadonly().',
      code: [
        { line: 'private _count = signal(0);', active: false },
        { line: 'count = this._count.asReadonly();', active: true },
      ],
    },
    {
      id: 'computed',
      label: 'Computed',
      writable: false,
      description: 'Derivado de otros signals con computed(). Siempre es de solo lectura.',
      code: [{ line: 'double = computed(() => this.count() * 2);', active: true }],
    },
  ];

  // Instancias reales de cada tipo, para introspeccionarlas con los helpers.
  private readonly writableSample = signal(0);
  private readonly samples: Record<string, Signal<number>> = {
    writable: this.writableSample,
    readonly: this.writableSample.asReadonly(),
    computed: computed(() => this.writableSample() * 2),
  };

  readonly selectedId = signal('writable');
  readonly selected = computed(
    () => this.kinds.find((k) => k.id === this.selectedId()) ?? this.kinds[0],
  );
  readonly lines = computed<CodeLine[]>(() => this.selected().code);

  // isSignal() / isWritableSignal() sobre la instancia real seleccionada.
  readonly introspection = computed(() => {
    const sample = this.samples[this.selectedId()];
    return {
      isSignal: isSignal(sample),
      isWritableSignal: isWritableSignal(sample),
    };
  });

  select(id: string) {
    this.selectedId.set(id);
  }
}
