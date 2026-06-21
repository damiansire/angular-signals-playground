import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { OldChangeDetectionComponent } from './old-change-detection.component';

describe('OldChangeDetectionComponent', () => {
  let component: OldChangeDetectionComponent;
  let fixture: ComponentFixture<OldChangeDetectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OldChangeDetectionComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OldChangeDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca con step en 0 y ningun nodo pintado', () => {
    expect(component.step()).toBe(0);
    const pintados = component.data().filter((n) => n.color === '#90EE90');
    expect(pintados.length).toBe(0);
  });

  it('incrementStep avanza de a 2 y pinta los nodos del nivel alcanzado', () => {
    component.incrementStep(); // step = 2
    expect(component.step()).toBe(2);
    // el nodo main (y=100 -> nivel 1) queda pintado con step>=1
    const main = component.data().find((n) => n.name === 'main')!;
    expect(main.color).toBe('#90EE90');
  });

  it('decrementStep no baja de 0', () => {
    component.decrementStep();
    expect(component.step()).toBe(0);
  });

  it('incrementStep deja de avanzar cuando step llega a 5+', () => {
    component.incrementStep(); // 2
    component.incrementStep(); // 4
    component.incrementStep(); // 6 (entra porque 4<5)
    expect(component.step()).toBe(6);
    component.incrementStep(); // no entra (6 no < 5)
    expect(component.step()).toBe(6);
  });

  it('el boton retroceder arranca deshabilitado en step 0', () => {
    const back = fixture.nativeElement.querySelector('button[disabled]') as HTMLButtonElement;
    expect(back).toBeTruthy();
  });
});
