import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { hasta } from '../testing/cuadros';
import { CinematicaComponent, type FinDeCinematica } from './cinematica.component';
import { cinematicaDe } from './cinematicas-datos';

describe('CinematicaComponent', () => {
  let vtOriginal: unknown;

  beforeEach(() => {
    // Sin View Transitions el cierre es un fundido corto: los tests no dependen de animaciones.
    const doc = document as unknown as Record<string, unknown>;
    vtOriginal = doc['startViewTransition'];
    doc['startViewTransition'] = undefined;
    TestBed.configureTestingModule({
      imports: [CinematicaComponent],
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    (document as unknown as Record<string, unknown>)['startViewTransition'] = vtOriginal;
  });

  /** El texto como se lee: el HTML colapsa los espacios entre palabras, el textContent no. */
  const frase = (raiz: HTMLElement): string =>
    (raiz.querySelector('.cine__frase')?.textContent ?? '').replace(/\s+/g, ' ').trim();

  async function montar(capitulo: number, fotograma: string | null = null) {
    const fixture = TestBed.createComponent(CinematicaComponent);
    fixture.componentRef.setInput('cinematica', cinematicaDe(capitulo)!);
    fixture.componentRef.setInput('fotograma', fotograma);
    fixture.componentRef.setInput('establecidos', [0, 1]);
    const fines: FinDeCinematica[] = [];
    fixture.componentInstance.termino.subscribe((f) => fines.push(f));
    fixture.detectChanges();
    await fixture.whenStable();
    // La escena es un chunk aparte y la cinemática se abre recién cuando cargó: se espera a eso (el
    // host suelta `cine-host--antes`), no un tiempo fijo que con la CPU tomada no alcanza.
    const host: HTMLElement = fixture.nativeElement;
    await hasta(() => !host.classList.contains('cine-host--antes'));
    expect(host.classList).withContext('la escena cargó y abrió').not.toContain('cine-host--antes');
    fixture.detectChanges();
    return { fixture, raiz: host.querySelector('.cine') as HTMLElement, fines };
  }

  it('un fotograma aplica todos los beats hasta el pedido y muestra su línea', async () => {
    const { fixture, raiz } = await montar(1, 'hilo-lectura');
    expect(raiz.classList).toContain('b-caja-ambar');
    expect(raiz.classList).toContain('b-hilo-lectura');
    expect(raiz.classList).not.toContain('b-aviso-pulso');
    expect(raiz.classList).toContain('cine--quieta');
    expect(frase(fixture.nativeElement)).toContain('mi panel se enteró');
    fixture.destroy();
  });

  it('pasa a la escena los capítulos establecidos y la variante', async () => {
    const { fixture, raiz } = await montar(12, 'fin');
    expect(raiz.classList).toContain('e-0');
    expect(raiz.classList).toContain('e-1');
    expect(raiz.classList).not.toContain('e-2');
    expect(raiz.classList).toContain('cine--incompleto');
    fixture.destroy();
  });

  it('dice quién habla: el nombre del personaje acompaña cada línea', async () => {
    const { fixture } = await montar(1, 'hilo-lectura');
    expect(fixture.nativeElement.querySelector('.cine__nombre')?.textContent).toContain('Nave A');
    fixture.destroy();
  });

  it('Enter trae la línea siguiente sin esperar al reloj', async () => {
    const { fixture } = await montar(1);
    expect(fixture.nativeElement.querySelector('.cine__frase')).toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(frase(fixture.nativeElement)).toContain('Encontré una caja');
    fixture.destroy();
  });

  it('Escape la saltea y avisa que fue salteada', async () => {
    const { fixture, fines } = await montar(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await hasta(() => fines.length > 0); // el aviso llega al terminar el fundido de cierre
    expect(fines).toEqual(['salteada']);
    fixture.destroy();
  });

  it('mientras está abierta, las teclas de desplazamiento no llegan al recorrido', async () => {
    const { fixture } = await montar(1);
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    document.dispatchEvent(e);
    expect(e.defaultPrevented).toBeTrue();
    fixture.destroy();
  });
});
