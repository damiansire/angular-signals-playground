import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { SIGNAL_FORMS_SYSTEM } from '../../io-systems';

interface Tripulante {
  nombre: string;
  correo: string;
}

const VACIO: Tripulante = { nombre: '', correo: '' };

@Component({
  selector: 'app-signal-forms',
  templateUrl: './signal-forms.component.html',
  styleUrl: './signal-forms.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, FormField],
})
export class SignalFormsComponent {
  readonly closingSystem = SIGNAL_FORMS_SYSTEM;

  /** La fuente de verdad. El form no guarda una copia: lo que se tipea se escribe acá. */
  readonly modelo = signal<Tripulante>({ ...VACIO });

  // Las reglas se declaran una vez; valid(), errors() y compañía se derivan solos del modelo.
  readonly tripulante = form(this.modelo, (t) => {
    required(t.nombre, { message: 'Falta el nombre' });
    minLength(t.nombre, 2, { message: 'Mínimo 2 letras' });
    required(t.correo, { message: 'Falta el correo' });
    email(t.correo, { message: 'Correo inválido' });
  });

  /** Lo que sale por el borde: quienes subieron a bordo con el form válido. */
  readonly tripulacion = signal<readonly string[]>([]);

  /** El modelo tal cual está ahora, para ver que el input escribe en el signal y no en otro lado. */
  readonly modeloEnVivo = computed(() => {
    const { nombre, correo } = this.modelo();
    return `{ nombre: "${nombre}", correo: "${correo}" }`;
  });

  sumar() {
    if (this.tripulante().invalid()) return;
    this.tripulacion.update((lista) => [...lista, this.modelo().nombre]);
    // reset(valor) vacía el modelo y además olvida touched/dirty: el próximo arranca limpio.
    this.tripulante().reset({ ...VACIO });
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'modelo = signal({ nombre: "", correo: "" });', active: false },
    { line: 'tripulante = form(this.modelo, (t) => {', active: true },
    { line: '  required(t.nombre);', active: false },
    { line: '  minLength(t.nombre, 2);', active: false },
    { line: '  email(t.correo);', active: false },
    { line: '});', active: true },
    { line: '', active: false },
    { line: '<input [formField]="tripulante.correo" />', active: true },
    { line: 'tripulante.correo().errors();', active: false },
    { line: 'tripulante().valid();', active: false },
  ]);
}
