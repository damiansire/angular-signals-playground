import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';

@Component({
  selector: 'app-reference-equality',
  templateUrl: './reference-equality.component.html',
  styleUrl: './reference-equality.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class ReferenceEqualityComponent {
  // Igualdad por defecto: Object.is (por referencia).
  readonly user = signal({ name: 'Ada' });

  // Contamos las notificaciones observando el signal con un effect.
  private readonly runs = signal(0);
  readonly notifications = computed(() => Math.max(0, this.runs() - 1));

  constructor() {
    effect(() => {
      this.user(); // se suscribe: el effect corre cada vez que `user` NOTIFICA
      this.runs.update((n) => n + 1);
    });
  }

  // Mismo contenido pero objeto NUEVO -> referencia distinta -> notifica.
  setSameContent() {
    this.user.set({ name: this.user().name });
  }

  // Exactamente el mismo objeto -> misma referencia -> NO notifica.
  setSameReference() {
    this.user.set(this.user());
  }

  setOtherName() {
    this.user.set({ name: this.user().name === 'Ada' ? 'Grace' : 'Ada' });
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: "user = signal({ name: 'Ada' });", active: false },
    { line: '', active: false },
    { line: '// Object.is compara por referencia:', active: true },
    { line: "user.set({ name: 'Ada' });  // objeto nuevo -> NOTIFICA", active: true },
    { line: 'user.set(user());           // misma ref  -> no notifica', active: true },
  ]);
}
