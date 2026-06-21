import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BasicFormComponent } from './basic-form.component';

describe('BasicFormComponent', () => {
  let component: BasicFormComponent;
  let fixture: ComponentFixture<BasicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicFormComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fullName computed combina firstName y surname y se refleja en el h1', () => {
    expect(component.fullName()).toBe('Damian Sire');
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Damian Sire!');
  });

  it('fullName se recalcula al cambiar las signals', () => {
    component.firstName.set('Ada');
    component.surname.set('Lovelace');
    fixture.detectChanges();
    expect(component.fullName()).toBe('Ada Lovelace');
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Ada Lovelace!');
  });

  it('setValue lee los inputs, actualiza signals y emite buttonClicked', () => {
    let clicked: { firstName: string; surname: string } | undefined;
    component.buttonClicked.subscribe((e) => (clicked = e));

    component.firstNameInput.nativeElement.value = 'Grace';
    component.surnameInput.nativeElement.value = 'Hopper';
    component.setValue();

    expect(component.firstName()).toBe('Grace');
    expect(component.surname()).toBe('Hopper');
    expect(clicked?.firstName).toBe('Grace');
    expect(clicked?.surname).toBe('Hopper');
  });

  it('el effect emite signalComputed con los valores actuales', () => {
    const emissions: { firstName: string; surname: string }[] = [];
    component.signalComputed.subscribe((e) => emissions.push(e));

    component.firstName.set('Linus');
    fixture.detectChanges();

    const last = emissions[emissions.length - 1];
    expect(last.firstName).toBe('Linus');
    expect(last.surname).toBe('Sire');
  });
});
