import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import axe from 'axe-core';

import { HttpResourceComponent, PROVEEDORES } from './http-resource.component';
import { anotarEnLaRed, RedDeLaDemo } from './red-de-la-demo';
import { aTripulante } from './tripulacion';

const ARMSTRONG = { nombre: 'Neil Armstrong', rol: 'Comandante' };
const ALDRIN = { nombre: 'Buzz Aldrin', rol: 'Piloto del módulo lunar' };
const NO_EXISTE = { status: 404, statusText: 'Not Found' };

/** Corre axe-core sobre el elemento y falla el test listando las violaciones (id + nodos). */
async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element);
  const summary = results.violations
    .map(
      (v) =>
        `- ${v.id} (${v.impact}): ${v.nodes.length} nodo(s): ${v.help}\n    ${v.nodes
          .map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').replace(/\n/g, ' '))
          .join('\n    ')}`,
    )
    .join('\n');
  expect(results.violations.length).withContext(summary).toBe(0);
}

describe('HttpResourceComponent', () => {
  let fixture: ComponentFixture<HttpResourceComponent>;
  let component: HttpResourceComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpResourceComponent],
      providers: [
        provideZonelessChangeDetection(),
        // Sin la latencia de la demo: acá los tiempos los maneja HttpTestingController.
        provideHttpClient(withInterceptors([anotarEnLaRed])),
        provideHttpClientTesting(),
        RedDeLaDemo,
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HttpResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const host = (): HTMLElement => fixture.nativeElement;

  /** Cómo terminó cada pedido que pasó por la red, del más nuevo al más viejo. */
  const red = (): (string | null)[] =>
    [...host().querySelectorAll('.htr-pedido')].map((li) => li.getAttribute('data-destino'));

  function elegir(id: number): void {
    component.elegir(id);
    fixture.detectChanges();
  }

  it('pide al #1 por una URL relativa y lo muestra al llegar', async () => {
    const pedido = http.expectOne('datos/tripulacion/1.json');
    expect(pedido.request.method).toBe('GET');
    expect(red()).toEqual(['viaja']);

    pedido.flush(ARMSTRONG);
    await fixture.whenStable();

    expect(component.tripulante.status()).toBe('resolved');
    expect(component.tripulante.statusCode()).toBe(200);
    expect(host().textContent).toContain('Neil Armstrong');
    expect(red()).toEqual(['200']);
  });

  it('cambiar de tripulante con el pedido en vuelo lo cancela: solo llega el último', async () => {
    const primero = http.expectOne('datos/tripulacion/1.json');
    elegir(2);

    expect(primero.cancelled).toBeTrue();
    http.expectOne('datos/tripulacion/2.json').flush(ALDRIN);
    await fixture.whenStable();

    expect(host().textContent).toContain('Buzz Aldrin');
    expect(host().textContent).not.toContain('Neil Armstrong');
    expect(red()).toEqual(['200', 'cancelado']);
  });

  it('el #4 da 404: la ficha lo muestra sin que la vista tire', async () => {
    http.expectOne('datos/tripulacion/1.json').flush(ARMSTRONG);
    await fixture.whenStable();

    elegir(4);
    http.expectOne('datos/tripulacion/4.json').flush(null, NO_EXISTE);
    await fixture.whenStable();

    expect(component.tripulante.status()).toBe('error');
    expect(component.tripulante.hasValue()).toBeFalse();
    expect(host().querySelector('.htr-fallo')?.textContent).toContain('404');
    expect(host().textContent).not.toContain('Neil Armstrong');
    expect(red()).toEqual(['404', '200']);
  });

  it('parse rechaza una respuesta sin forma de tripulante, aunque la red diga 200', async () => {
    http.expectOne('datos/tripulacion/1.json').flush({ name: 'Neil' });
    await fixture.whenStable();

    expect(component.tripulante.status()).toBe('error');
    expect(component.tripulante.statusCode()).toBe(200);
    expect(red()).toEqual(['200']);
  });

  it('no tiene violaciones de accesibilidad detectables por axe-core (tripulante cargado)', async () => {
    http.expectOne('datos/tripulacion/1.json').flush(ARMSTRONG);
    await fixture.whenStable();
    await expectNoA11yViolations(host());
  });
});

describe('aTripulante', () => {
  it('deja pasar un tripulante bien formado, sin campos de más', () => {
    expect(aTripulante({ ...ARMSTRONG, extra: 1 })).toEqual(ARMSTRONG);
  });

  it('tira ante cualquier otra forma: el genérico de httpResource no lo hubiera visto', () => {
    for (const crudo of [
      null,
      undefined,
      'Neil',
      4,
      { nombre: 'Neil' },
      { name: 'Neil', rol: 1 },
    ]) {
      expect(() => aTripulante(crudo))
        .withContext(JSON.stringify(crudo) ?? 'undefined')
        .toThrow();
    }
  });
});

describe('PROVEEDORES del 6/3', () => {
  it('traen HttpClient y la red de la demo, sin pasar por app.config', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ...PROVEEDORES],
    });
    expect(TestBed.inject(HttpClient)).toBeTruthy();
    expect(TestBed.inject(RedDeLaDemo).pedidos()).toEqual([]);
  });
});
