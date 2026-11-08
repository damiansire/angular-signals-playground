import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BitacoraComponent, type CapituloDeBitacora } from './bitacora.component';
import { PARTIDA_VACIA, type Partida } from '../../libs/partida';

/** La posición (`concepto`) y el capítulo no coinciden: el capítulo 0 pasó a la historia. */
const CAPITULOS: CapituloDeBitacora[] = [
  {
    concepto: 0,
    numero: 1,
    nombre: 'Signals',
    titulo: 'El que avisa',
    ley: 'Un valor avisa.',
    subs: 3,
  },
  {
    concepto: 1,
    numero: 2,
    nombre: 'Computed',
    titulo: 'El derivado',
    ley: 'Un derivado no se toca.',
    subs: 2,
  },
];

describe('BitacoraComponent', () => {
  async function montar(partida: Partida, leyFinal: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [BitacoraComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(BitacoraComponent);
    fixture.componentRef.setInput('partida', partida);
    fixture.componentRef.setInput('capitulos', CAPITULOS);
    fixture.componentRef.setInput('leyFinal', leyFinal);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('cuenta los capítulos establecidos, no los sub-niveles', async () => {
    const fixture = await montar({ ...PARTIDA_VACIA, establecidos: ['1/0', '1/1'] });
    const titulo: HTMLElement = fixture.nativeElement.querySelector('.bita__titulo');
    expect(titulo.textContent).toContain('1 de 2');
  });

  it('solo muestra la ley de lo que el jugador estableció', async () => {
    const fixture = await montar({ ...PARTIDA_VACIA, establecidos: ['1/0'] });
    const leyes = [...fixture.nativeElement.querySelectorAll('.bita__ley')].map((e) =>
      (e as HTMLElement).textContent?.trim(),
    );
    expect(leyes).toEqual(['Sin establecer', 'Un derivado no se toca.']);
  });

  it('marca un pip por sub-nivel sellado', async () => {
    const fixture = await montar({ ...PARTIDA_VACIA, establecidos: ['0/0', '0/2'] });
    const pips = [...fixture.nativeElement.querySelectorAll('.bita__cap')[0].querySelectorAll('i')];
    expect(pips.map((p) => (p as HTMLElement).classList.contains('on'))).toEqual([
      true,
      false,
      true,
    ]);
  });

  it('solo deja volver a ver las cinemáticas que ya se vieron', async () => {
    const fixture = await montar({ ...PARTIDA_VACIA, cinematicas: [2] });
    const botones = [
      ...fixture.nativeElement.querySelectorAll('.bita__ver'),
    ] as HTMLButtonElement[];
    expect(botones.map((b) => b.disabled)).toEqual([true, false]);

    // Pide el capítulo, no la posición: la cinemática se busca por su número.
    let pedido = -1;
    fixture.componentInstance.verCinematica.subscribe((n) => (pedido = n));
    botones[1].click();
    expect(pedido).toBe(2);
  });

  it('el manual de a bordo se abre aunque no se haya visto el prólogo', async () => {
    const fixture = await montar(PARTIDA_VACIA);
    const botones = [
      ...fixture.nativeElement.querySelectorAll('.bita__pie .bita__accion'),
    ] as HTMLButtonElement[];
    const manual = botones.find((b) => b.textContent?.includes('Manual de a bordo'));
    expect(manual).withContext('botón del manual').toBeDefined();

    let pidio = false;
    fixture.componentInstance.verManual.subscribe(() => (pidio = true));
    manual!.click();
    expect(pidio).toBeTrue();
  });

  it('el árbol de Signal Space se abre aunque no se haya visto el prólogo', async () => {
    const fixture = await montar(PARTIDA_VACIA);
    const botones = [
      ...fixture.nativeElement.querySelectorAll('.bita__pie .bita__accion'),
    ] as HTMLButtonElement[];
    const arbol = botones.find((b) => b.textContent?.includes('Signal Space'));
    expect(arbol).withContext('botón del árbol').toBeDefined();

    let pidio = false;
    fixture.componentInstance.verArbol.subscribe(() => (pidio = true));
    arbol!.click();
    expect(pidio).toBeTrue();
  });

  it('el final aparece en la lista recién cuando se vio', async () => {
    const sinFinal = await montar(PARTIDA_VACIA);
    expect(sinFinal.nativeElement.querySelector('.bita__cap--final')).toBeNull();
    TestBed.resetTestingModule();
    const conFinal = await montar({ ...PARTIDA_VACIA, cinematicas: [12] }, 'Se lo entiende.');
    expect(conFinal.nativeElement.querySelector('.bita__cap--final')?.textContent).toContain(
      'Se lo entiende.',
    );
  });

  it('empezar de cero pide confirmación antes de borrar', async () => {
    const fixture = await montar(PARTIDA_VACIA);
    let borro = false;
    fixture.componentInstance.borrar.subscribe(() => (borro = true));
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.bita__accion--borrar');

    boton.click();
    fixture.detectChanges();
    expect(borro).toBeFalse();
    expect(boton.textContent).toContain('¿Seguro?');

    boton.click();
    expect(borro).toBeTrue();
  });

  it('Escape cierra', async () => {
    const fixture = await montar(PARTIDA_VACIA);
    let cerro = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerro = true));
    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cerro).toBeTrue();
  });
});
