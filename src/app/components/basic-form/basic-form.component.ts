import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
interface ClickInButton {
  date: Date;
  firstName: string;
  surname: string;
}

@Component({
    selector: 'app-basic-form',
    imports: [],
    templateUrl: './basic-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './basic-form.component.css'
})
export class BasicFormComponent {
  firstName: WritableSignal<string> = signal('Damian');
  surname: WritableSignal<string> = signal('Sire');
  fullName: Signal<string> = computed(() => {
    return `${this.firstName()} ${this.surname()}`;
  });
  @ViewChild('firstNameInput') firstNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('surnameInput') surnameInput!: ElementRef<HTMLInputElement>;
  @Output() signalComputed = new EventEmitter<ClickInButton>();
  @Output() buttonClicked = new EventEmitter<ClickInButton>();

  constructor() {
    effect(() => {
      const currentFullName = this.fullName();
      this.signalComputed.emit({
        date: new Date(),
        firstName: this.firstName(),
        surname: this.surname(),
      });
    });
  }

  setValue() {
    const firstName = this.firstNameInput.nativeElement.value;
    const surname = this.surnameInput.nativeElement.value;
    this.firstName.set(firstName);
    this.surname.set(surname);
    this.buttonClicked.emit({
      date: new Date(),
      firstName,
      surname,
    });
  }
}
