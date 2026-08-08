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
  // `Date.now()`), que no coopera con el `jasmine.clock()` mockeado: hay que usar timers reales.
  // `flushDebounce` fuerza el effect de `toObservable` (zoneless no lo vuelca solo).
  const flushDebounce = () => fixture.detectChanges();
  const VENTANA_MS = 400;

  /**
   * Espera de verdad y devuelve cuánto tardó. Un `sleep(250)` en un runner cargado puede tardar
   * más que la ventana entera, y ahí "todavía no emitió" deja de ser una afirmación sobre el
   * código para pasar a ser una sobre la máquina. Las afirmaciones negativas se hacen solo si el
   * reloj real confirma que seguimos dentro de la ventana; las positivas esperan de más, que
   * nunca da falso verde.
   */
  async function dormir(ms: number): Promise<number> {
    const desde = performance.now();
    await new Promise((resolve) => setTimeout(resolve, ms));
    return performance.now() - desde;
  }

  it('debounced refleja el valor recién ~400ms después de la última tecla', async () => {
    component.setQuery('ho');
    flushDebounce();
    // Sincrónico, sin reloj de por medio: acaba de escribirse, no puede haber emitido.
    expect(component.debounced()).toBe('');

    await dormir(VENTANA_MS + 250);
    expect(component.debounced()).toBe('ho');
  });

  it('una tecla dentro de la ventana reinicia el debounce: solo emite el último', async () => {
    component.setQuery('h');
    flushDebounce();

    const dentroDeLaVentana = await dormir(200);
    component.setQuery('ho');
    const reinicio = performance.now();
    flushDebounce(); // reinicia la ventana con 'ho'

    // Si el runner se colgó y ya pasaron los 400ms de 'h', esa parte no se puede afirmar.
    if (dentroDeLaVentana < VENTANA_MS) {
      await dormir(150);
      if (performance.now() - reinicio < VENTANA_MS) {
        expect(component.debounced()).toBe('');
      }
    }

    await dormir(VENTANA_MS + 250);
    // Lo que SÍ es siempre verificable: el valor final es el último, nunca el intermedio.
    expect(component.debounced()).toBe('ho');
  });
});
