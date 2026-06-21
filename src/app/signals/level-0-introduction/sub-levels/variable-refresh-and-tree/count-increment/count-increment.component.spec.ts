import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountIncrementComponent } from './count-increment.component';

describe('CountIncrementComponent', () => {
  let component: CountIncrementComponent;
  let fixture: ComponentFixture<CountIncrementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountIncrementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountIncrementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca en 0 y muestra que es multiplo de 2 y de 3', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('El valor es:');
    expect(text).toContain('0');
    // 0 es multiplo de 2 y de 3 -> "Si" en ambos
    const sis = (text.match(/Si/g) ?? []).length;
    expect(sis).toBe(2);
  });

  it('increment incrementa el contador', () => {
    component.increment();
    expect(component.count).toBe(1);
  });

  it('al clickear Increment se actualiza el valor y los multiplos en pantalla', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    button.click(); // count = 1
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('1');
    // 1 no es multiplo de 2 ni de 3 -> "No" dos veces
    const nos = (text.match(/No/g) ?? []).length;
    expect(nos).toBe(2);
  });
});
