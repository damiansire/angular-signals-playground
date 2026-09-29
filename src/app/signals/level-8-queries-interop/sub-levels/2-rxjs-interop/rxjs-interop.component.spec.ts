import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { RxjsInteropComponent } from './rxjs-interop.component';

describe('RxjsInteropComponent', () => {
  let component: RxjsInteropComponent;
  let fixture: ComponentFixture<RxjsInteropComponent>;

  // Reloj falso ANTES de crear el componente: toSignal se suscribe al interval en el constructor, así
  // que el setInterval de RxJS tiene que nacer ya sobre el reloj controlado por los tests.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RxjsInteropComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    jasmine.clock().install();

    fixture = TestBed.createComponent(RxjsInteropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  // Mueve el host de la card adentro de un contenedor, como hace la vista integrada con las cards.
  const envolver = (configurar: (contenedor: HTMLElement) => void): HTMLElement => {
    const contenedor = document.body.appendChild(document.createElement('div'));
    configurar(contenedor);
    contenedor.appendChild(fixture.nativeElement);
    return contenedor;
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('untracked: cambiar multiplier no recalcula result hasta que cambia base', () => {
    expect(component.result()).toBe(20); // 10 * 2

    component.incMultiplier(); // multiplier = 3, pero no es dependencia
    expect(component.result()).toBe(20); // sigue memoizado

    component.incBase(); // base = 11 -> recalcula con multiplier actual (3)
    expect(component.result()).toBe(33);
  });

  it('toSignal: con la card visible el cronómetro cuenta un segundo por tick', () => {
    expect(component.seconds()).toBe(0);

    jasmine.clock().tick(3000);

    expect(component.seconds()).toBe(3);
  });

  it('con la card inerte no cuenta, y al volver sigue desde donde quedó sin saltar', () => {
    jasmine.clock().tick(2000);
    expect(component.seconds()).toBe(2);

    const card = envolver((c) => (c.inert = true));
    jasmine.clock().tick(5000); // parado en otro nivel
    expect(component.seconds()).toBe(2);

    card.inert = false;
    jasmine.clock().tick(1000);
    expect(component.seconds()).toBe(3); // no 8: los segundos inertes no se cobran al volver
    card.remove();
  });

  it('la pausa de la vida de fondo del recorrido NO frena el conteo (es la lección)', () => {
    const recorrido = envolver((c) => (c.className = 'fondo-en-pausa'));

    jasmine.clock().tick(2000);

    expect(component.seconds()).toBe(2);
    recorrido.remove();
  });
});
