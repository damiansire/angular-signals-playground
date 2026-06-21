import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComputedSignalsLazilyEvaluatedMemoizedComponent } from './computed-signals-lazily-evaluated-memoized.component';
import { ClickInButton } from '../../../../components/component.interface';

describe('ComputedSignalsLazilyEvaluatedMemoizedComponent', () => {
  let component: ComputedSignalsLazilyEvaluatedMemoizedComponent;
  let fixture: ComponentFixture<ComputedSignalsLazilyEvaluatedMemoizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputedSignalsLazilyEvaluatedMemoizedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ComputedSignalsLazilyEvaluatedMemoizedComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clickHistory arranca vacio (el form aun no emitio clicks de boton)', () => {
    expect(component.clickHistory).toEqual([]);
  });

  it('addComputedSignal agrega un registro al computedTracker', () => {
    const before = component.computedTracker.length;
    const data: ClickInButton = { date: new Date(), firstName: 'Ada', surname: 'Lovelace' };
    component.addComputedSignal(data);
    expect(component.computedTracker.length).toBe(before + 1);
    expect(component.computedTracker[component.computedTracker.length - 1]).toBe(data);
  });

  it('addClickToHistory acumula en clickHistory', () => {
    const ev: ClickInButton = { date: new Date(), firstName: 'Grace', surname: 'Hopper' };
    component.addClickToHistory(ev);
    expect(component.clickHistory.length).toBe(1);
    expect(component.clickHistory[0]).toBe(ev);
  });

  it('renderiza el formulario y los dos paneles de historial', () => {
    expect(fixture.nativeElement.querySelector('app-basic-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-click-history')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-computed-tracker')).toBeTruthy();
  });
});
