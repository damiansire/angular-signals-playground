import {
  Component,
  output,
  Signal,
  WritableSignal,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { map } from 'rxjs';
// El mismo tipo que consumen click-history, computed-tracker y event: estaba redeclarado acá
// igual pero por separado, así que los dos podían driftear sin que nada avisara.
import { ClickInButton } from '../component.interface';

@Component({
  selector: 'app-basic-form',
  imports: [FormField],
  templateUrl: './basic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './basic-form.component.css',
})
export class BasicFormComponent {
  readonly firstName: WritableSignal<string> = signal('Damian');
  readonly surname: WritableSignal<string> = signal('Sire');
  readonly fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });
  // Typing edits this draft: firstName and surname only change when Set is pressed.
  readonly nameDraft = signal({ firstName: '', surname: '' });
  readonly nameForm = form(this.nameDraft);
  // Derivamos la salida del estado en vez de emitir desde un effect(): el
  // computed expone el par firstName/surname y outputFromObservable emite el
  // valor inicial y cada recomputo (cuando cambia algun signal que lee).
  private readonly nameData = computed(() => ({
    firstName: this.firstName(),
    surname: this.surname(),
  }));
  readonly signalComputed = outputFromObservable(
    toObservable(this.nameData).pipe(map((data) => ({ date: new Date(), ...data }))),
  );
  readonly buttonClicked = output<ClickInButton>();

  setValue() {
    const { firstName, surname } = this.nameDraft();
    this.firstName.set(firstName);
    this.surname.set(surname);
    this.buttonClicked.emit({
      date: new Date(),
      firstName,
      surname,
    });
  }
}
