import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { EventHistoryComponent } from './event-history.component';
import { HistoryElement } from '../component.interface';

describe('EventHistoryComponent', () => {
  let component: EventHistoryComponent;
  let fixture: ComponentFixture<EventHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventHistoryComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(EventHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('beforeNumber devuelve el valor menos uno', () => {
    expect(component.beforeNumber(5)).toBe(4);
    expect(component.beforeNumber('10')).toBe(9);
  });

  it('refleja el input title en el h2', () => {
    fixture.componentRef.setInput('title', 'Historial de eventos');
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2') as HTMLElement;
    expect(h2.textContent?.trim()).toBe('Historial de eventos');
  });

  it('renderiza un item por cada elemento del historial mostrando stateName y trigger', () => {
    const history: HistoryElement[] = [
      { date: new Date(), trigger: 'set', newState: 1, isCountIncrement: false },
      { date: new Date(), trigger: 'update', newState: 2, isCountIncrement: false },
    ];
    fixture.componentRef.setInput('stateName', 'Counter');
    fixture.componentRef.setInput('history', history);
    fixture.detectChanges();

    const triggers = fixture.nativeElement.querySelectorAll('h3');
    expect(triggers.length).toBe(2);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Counter');
    expect(text).toContain('set');
    expect(text).toContain('update');
  });

  it('no muta el array de history del padre y muestra el mas reciente primero', () => {
    const history: HistoryElement[] = [
      { date: new Date('2026-01-01'), trigger: 'set', newState: 1, isCountIncrement: false },
      { date: new Date('2026-01-02'), trigger: 'update', newState: 2, isCountIncrement: false },
      { date: new Date('2026-01-03'), trigger: 'update', newState: 3, isCountIncrement: false },
    ];
    fixture.componentRef.setInput('history', history);

    // Varios ciclos de CD: la version vieja llamaba Array.prototype.reverse() (muta y devuelve
    // this) desde el template en cada chequeo, asi que el array del padre quedaba invertido o
    // reinvertido segun cuantas veces corria CD. El input tiene que sobrevivir intacto.
    fixture.detectChanges();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(history.map((item) => item.newState)).toEqual([1, 2, 3]);

    const values = Array.from(fixture.nativeElement.querySelectorAll('.text-lg.font-medium')).map(
      (el) => (el as HTMLElement).textContent?.trim(),
    );
    expect(values).toEqual(['3', '2', '1']);
  });

  it('el rotulo de stateName no se parte en dos renglones ni queda pegado al trigger', () => {
    const history: HistoryElement[] = [
      { date: new Date(), trigger: 'set', newState: 1, isCountIncrement: false },
    ];
    fixture.componentRef.setInput('stateName', 'Count Number:');
    fixture.componentRef.setInput('history', history);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.bg-gray-100') as HTMLElement;
    const label = row.querySelector('span') as HTMLElement;
    const triggerHeading = row.querySelector('h3') as HTMLElement;

    // Un solo nivel de flex: ya no hay un "flex justify-between" anidado adentro de la fila
    // (row.querySelectorAll busca en los descendientes, no en si mismo).
    expect(row.querySelectorAll('.flex.justify-between').length).toBe(0);
    expect(getComputedStyle(label).whiteSpace).toBe('nowrap');

    // El rotulo no se parte en dos renglones: su alto de caja no supera una sola linea.
    const lineHeight = parseFloat(getComputedStyle(label).lineHeight);
    expect(label.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight + 1);

    // El bloque de trigger no queda pegado al valor: hay separacion horizontal real entre ambos.
    const valueBlock = row.querySelector('.items-baseline') as HTMLElement;
    expect(triggerHeading.getBoundingClientRect().left).toBeGreaterThan(
      valueBlock.getBoundingClientRect().right,
    );
  });
});
