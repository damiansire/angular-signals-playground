import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlidersControlButtonsComponent } from './sliders-control-buttons.component';

describe('SlidersControlButtonsComponent', () => {
  let component: SlidersControlButtonsComponent;
  let fixture: ComponentFixture<SlidersControlButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlidersControlButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlidersControlButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('nextSlider incrementa de forma circular modulo 4 y emite el valor', () => {
    const emitted: number[] = [];
    component.sliderChanged.subscribe((n) => emitted.push(n));

    component.nextSlider();
    component.nextSlider();
    component.nextSlider();
    component.nextSlider();

    expect(emitted).toEqual([1, 2, 3, 0]);
    expect(component.sliderNumber).toBe(0);
  });

  it('beforeSlider decrementa envolviendo de 0 a 3', () => {
    let last: number | undefined;
    component.sliderChanged.subscribe((n) => (last = n));

    component.beforeSlider();
    expect(component.sliderNumber).toBe(3);
    expect(last).toBe(3);
  });

  const labels = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button')).map((b) =>
      (b as HTMLElement).textContent?.trim()
    );

  const clickByLabel = (label: string) => {
    const btn = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((b) => (b as HTMLElement).textContent?.trim() === label) as HTMLElement;
    btn.click();
    fixture.detectChanges();
  };

  it('en el estado inicial muestra solo Next (oculta Prev)', () => {
    expect(labels()).toEqual(['Next']);
  });

  it('al hacer click en Next pasa a mostrar Prev y Next', () => {
    clickByLabel('Next');
    expect(component.sliderNumber).toBe(1);
    expect(labels()).toContain('Prev');
    expect(labels()).toContain('Next');
  });

  it('con dos clicks en Next (slider=2) muestra solo Prev', () => {
    clickByLabel('Next');
    clickByLabel('Next');
    expect(component.sliderNumber).toBe(2);
    expect(labels()).toEqual(['Prev']);
  });
});
