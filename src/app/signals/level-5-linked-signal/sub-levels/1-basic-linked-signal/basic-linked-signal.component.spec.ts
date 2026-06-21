import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BasicLinkedSignalComponent } from './basic-linked-signal.component';

describe('BasicLinkedSignalComponent', () => {
  let component: BasicLinkedSignalComponent;
  let fixture: ComponentFixture<BasicLinkedSignalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicLinkedSignalComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicLinkedSignalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca seleccionando la primera opción de la fuente', () => {
    expect(component.selectedOption()).toBe('Ground');
  });

  it('permite editar la selección como un signal normal', () => {
    component.select('Sea');
    expect(component.selectedOption()).toBe('Sea');
  });

  it('reinicia la selección a la primera opción cuando cambia la fuente', () => {
    component.select('Sea');
    expect(component.selectedOption()).toBe('Sea');

    component.useDomestic(); // ['Ground', 'Air'] -> se reinicia
    expect(component.selectedOption()).toBe('Ground');

    component.useInternational(); // ['Air', 'Sea', 'Express'] -> se reinicia
    expect(component.selectedOption()).toBe('Air');
  });
});
