import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComputedSignalsLazilyEvaluatedMemoizedComponent } from './computed-signals-lazily-evaluated-memoized.component';
import { ClickHistoryComponent } from '../../../../components/click-history/click-history.component';
import { ClickInButton } from '../../../../components/component.interface';

describe('ComputedSignalsLazilyEvaluatedMemoizedComponent', () => {
  let component: ComputedSignalsLazilyEvaluatedMemoizedComponent;
  let fixture: ComponentFixture<ComputedSignalsLazilyEvaluatedMemoizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalsLazilyEvaluatedMemoizedComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputedSignalsLazilyEvaluatedMemoizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clickHistory arranca vacio (el form aun no emitio clicks de boton)', () => {
    expect(component.clickHistory()).toEqual([]);
  });

  it('addComputedSignal acumula con una NUEVA referencia (no muta el array previo)', () => {
    // El form emite un signalComputed inicial con sus defaults, así que arranca con 1 registro.
    const data: ClickInButton = { date: new Date(), firstName: 'Ada', surname: 'Lovelace' };
    const prev = component.computedTracker();
    component.addComputedSignal(data);
    const next = component.computedTracker();
    expect(next.length).toBe(prev.length + 1);
    expect(next[next.length - 1]).toBe(data);
    // La clave del patrón: el array cambió de identidad, así OnPush + input() lo detectan.
    expect(next).not.toBe(prev);
  });

  it('addClickToHistory acumula con una NUEVA referencia', () => {
    const ev: ClickInButton = { date: new Date(), firstName: 'Grace', surname: 'Hopper' };
    const prev = component.clickHistory();
    component.addClickToHistory(ev);
    expect(component.clickHistory()).toEqual([ev]);
    expect(component.clickHistory()).not.toBe(prev);
  });

  it('bajo OnPush, un click agregado SE PROPAGA al panel hijo (el anti-patron push() no lo hacia)', () => {
    const child = fixture.debugElement.query(By.directive(ClickHistoryComponent))
      .componentInstance as ClickHistoryComponent;
    expect(child.clickHistory()).toEqual([]);
    const ev: ClickInButton = { date: new Date(), firstName: 'Grace', surname: 'Hopper' };
    component.addClickToHistory(ev);
    fixture.detectChanges();
    expect(child.clickHistory()).toEqual([ev]);
  });

  it('renderiza el formulario y los dos paneles de historial', () => {
    expect(fixture.nativeElement.querySelector('app-basic-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-click-history')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-computed-tracker')).toBeTruthy();
  });
});
