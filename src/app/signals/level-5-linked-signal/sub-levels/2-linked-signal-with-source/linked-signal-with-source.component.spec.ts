import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkedSignalWithSourceComponent } from './linked-signal-with-source.component';

describe('LinkedSignalWithSourceComponent', () => {
  let component: LinkedSignalWithSourceComponent;
  let fixture: ComponentFixture<LinkedSignalWithSourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedSignalWithSourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkedSignalWithSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserva la selección si sigue disponible al cambiar la fuente', () => {
    component.select('Air');
    component.useInternational(); // ['Air', 'Sea', 'Express'] incluye 'Air'
    expect(component.selectedOption()).toBe('Air');
  });

  it('se reinicia a la primera opción si la selección ya no está disponible', () => {
    component.select('Sea');
    component.useDomestic(); // ['Ground', 'Air'] -> 'Sea' no está
    expect(component.selectedOption()).toBe('Ground');
  });
});
