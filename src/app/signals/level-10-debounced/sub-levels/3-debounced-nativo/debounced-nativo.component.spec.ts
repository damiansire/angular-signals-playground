import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DebouncedNativoComponent } from './debounced-nativo.component';
import { DEBOUNCED_NATIVE_SYSTEM } from '../../debounce-systems';

describe('DebouncedNativoComponent', () => {
  let component: DebouncedNativoComponent;
  let fixture: ComponentFixture<DebouncedNativoComponent>;

  beforeEach(async () => {
    jasmine.clock().install();
    await TestBed.configureTestingModule({
      imports: [DebouncedNativoComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedNativoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jasmine.clock().uninstall());

  /** Una tecla tal como pasa en pantalla: el input cambia y la vista se vuelve a pintar. */
  function tipear(value: string) {
    component.setQuery(value);
    fixture.detectChanges(); // corre el effect de debounced(): arranca (o reinicia) la espera
  }

  /**
   * Deja pasar `ms` de reloj. El timer de debounced() resuelve una promesa y el valor nuevo entra
   * en su `.then`, que es una microtarea: sin vaciarla, el reloj avanzó pero el valor todavía no.
   */
  async function pasan(ms: number) {
    jasmine.clock().tick(ms);
    await Promise.resolve();
    fixture.detectChanges();
  }

  const texto = (selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim();

  it('arranca estable, con la consulta vacía', () => {
    expect(component.debouncedQuery.status()).toBe('resolved');
    expect(component.debouncedQuery.value()).toBe('');
    expect(component.debouncedQuery.isLoading()).toBeFalse();
  });

  it('mientras espera, .value() sostiene el último valor estable y status() dice loading', () => {
    tipear('ho');

    expect(component.query()).toBe('ho');
    expect(component.debouncedQuery.status()).toBe('loading');
    expect(component.debouncedQuery.isLoading()).toBeTrue();
    expect(component.debouncedQuery.value()).toBe('');
  });

  it('recién a los 400ms de la última tecla .value() alcanza a la consulta', async () => {
    tipear('ho');

    await pasan(399);
    expect(component.debouncedQuery.value()).toBe('');
    expect(component.debouncedQuery.status()).toBe('loading');

    await pasan(1);
    expect(component.debouncedQuery.value()).toBe('ho');
    expect(component.debouncedQuery.status()).toBe('resolved');
  });

  it('cada tecla reinicia la espera: una ráfaga es una sola búsqueda al leer .value()', async () => {
    for (const parcial of ['h', 'ho', 'hol', 'hola']) {
      tipear(parcial);
      await pasan(300);
    }

    expect(component.rawSearches()).toBe(4);
    expect(component.debouncedSearches()).toBe(0);
    expect(component.debouncedQuery.value()).toBe('');

    await pasan(100);
    expect(component.debouncedQuery.value()).toBe('hola');
    expect(component.debouncedSearches()).toBe(1);
    expect(component.rawSearches()).toBe(4);
  });

  it('volver al valor estable antes de que venza la espera no es una búsqueda nueva', async () => {
    tipear('a');
    tipear('');
    await pasan(400);

    expect(component.debouncedQuery.status()).toBe('resolved');
    expect(component.debouncedQuery.value()).toBe('');
    expect(component.rawSearches()).toBe(2);
    expect(component.debouncedSearches()).toBe(0);
  });

  it('la pantalla muestra la espera: status loading y la barra, que se va al resolver', async () => {
    tipear('hola');
    expect(texto('.dbn-status')).toBe('loading');
    expect(texto('.dbn-val--settled')).toBe('""');
    expect(fixture.nativeElement.querySelector('.dbn-wait-fill')).not.toBeNull();

    await pasan(400);
    expect(texto('.dbn-status')).toBe('resolved');
    expect(texto('.dbn-val--settled')).toBe('"hola"');
    expect(fixture.nativeElement.querySelector('.dbn-wait-fill')).toBeNull();
  });

  // Por la clase y no por el estilo computado: con "reducir movimiento" del sistema operativo la
  // animación es `none` en las dos copias y el test mediría la preferencia, no el reinicio.
  it('una tecla durante la espera reinicia la barra: salta a la otra animación', () => {
    const animacion = () =>
      fixture.nativeElement
        .querySelector('.dbn-wait-fill')
        .classList.contains('dbn-wait-fill--odd') as boolean;

    tipear('h');
    const primera = animacion();
    tipear('ho');
    const segunda = animacion();
    tipear('hol');

    expect(segunda).not.toBe(primera);
    expect(animacion()).toBe(primera);
  });

  it('cierra con el desafío de leer .value() en vez de la consulta cruda', () => {
    expect(component.closingSystem).toBe(DEBOUNCED_NATIVE_SYSTEM);
    expect(fixture.nativeElement.querySelector('app-manipulable-system')).not.toBeNull();
  });
});
