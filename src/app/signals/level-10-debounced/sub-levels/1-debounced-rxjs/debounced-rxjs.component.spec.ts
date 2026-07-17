import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DebouncedRxjsComponent } from './debounced-rxjs.component';

describe('DebouncedRxjsComponent', () => {
  let component: DebouncedRxjsComponent;
  let fixture: ComponentFixture<DebouncedRxjsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedRxjsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedRxjsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el valor inmediato cambia al instante', () => {
    component.setQuery('ho');
    expect(component.query()).toBe('ho');
  });

  // `debounceTime` corre sobre el `asyncScheduler` real de RxJS (mide la ventana con
  // `Date.now()`), que no coopera con el `jasmine.clock()` mockeado: usamos timers
  // reales con márgenes amplios sobre la ventana de 400ms. `flushDebounce` fuerza el
  // effect de `toObservable` (zoneless no lo vuelca solo) antes de esperar el reloj.
  const flushDebounce = () => fixture.detectChanges();
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('debounced refleja el valor recién ~400ms después de la última tecla', async () => {
    component.setQuery('ho');
    flushDebounce();
    // Recién emitido: todavía dentro de la ventana de 400ms.
    expect(component.debounced()).toBe('');
    await sleep(550);
    expect(component.debounced()).toBe('ho');
  });

  it('una tecla dentro de la ventana reinicia el debounce: solo emite el último', async () => {
    component.setQuery('h');
    flushDebounce();
    await sleep(200); // dentro de la ventana de 'h'
    component.setQuery('ho');
    flushDebounce(); // reinicia la ventana con 'ho'
    await sleep(250); // 250ms desde 'ho' (<400): 'h' fue descartado y 'ho' aún no emite
    expect(component.debounced()).toBe('');
    await sleep(300); // total >400ms desde 'ho'
    expect(component.debounced()).toBe('ho');
  });
});
