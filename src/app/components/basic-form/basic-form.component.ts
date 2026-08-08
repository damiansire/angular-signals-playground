import {
  Component,
  ElementRef,
  output,
  Signal,
  viewChild,
  WritableSignal,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
// El mismo tipo que consumen click-history, computed-tracker y event: estaba redeclarado acá
// igual pero por separado, así que los dos podían driftear sin que nada avisara.
import { ClickInButton } from '../component.interface';

@Component({
  selector: 'app-basic-form',
  imports: [],
  templateUrl: './basic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './basic-form.component.css',
})
export class BasicFormComponent {
  firstName: WritableSignal<string> = signal('Damian');
  surname: WritableSignal<string> = signal('Sire');
  fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });
  readonly firstNameInput = viewChild.required<ElementRef<HTMLInputElement>>('firstNameInput');
  readonly surnameInput = viewChild.required<ElementRef<HTMLInputElement>>('surnameInput');
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
    const firstName = this.firstNameInput().nativeElement.value;
    const surname = this.surnameInput().nativeElement.value;
    this.firstName.set(firstName);
    this.surname.set(surname);
    this.buttonClicked.emit({
      date: new Date(),
      firstName,
      surname,
    });
  }
}
