import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SignalRulesComponent } from './signal-rules.component';

describe('SignalRulesComponent', () => {
  let component: SignalRulesComponent;
  let fixture: ComponentFixture<SignalRulesComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalRulesComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalRulesComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const interruptor = (indice: number) =>
    host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[indice];
  const dial = () => host.querySelector<HTMLInputElement>('#rgl-frecuencia')!;
  const clave = () => host.querySelector<HTMLInputElement>('#rgl-clave');
  const error = () => host.querySelector('.rgl-nota--error')?.textContent?.trim();
  const activa = (fragmento: string) =>
    component.lines().find((l) => String(l.line).includes(fragmento))?.active;

  async function tocar(indice: number) {
    interruptor(indice).click();
    await fixture.whenStable();
  }

  async function escribir(input: HTMLInputElement, valor: string) {
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('arranca al aire: la clave oculta no invalida el panel', () => {
    expect(component.panel.clave().hidden()).toBeTrue();
    expect(component.alAire()).toBeTrue();
    expect(clave()).toBeNull();
    expect(activa('hidden(')).toBeTrue();
  });

  it('el dial respeta los límites del schema', () => {
    expect(dial().min).toBe('88');
    expect(dial().max).toBe('108');
    expect(dial().value).toBe('98');
  });

  it('automatica apaga el dial y dice por qué', async () => {
    await tocar(0);
    expect(dial().disabled).toBeTrue();
    expect(host.textContent).toContain('La elige el repetidor');
    expect(activa('disabled(')).toBeTrue();

    await tocar(0);
    expect(dial().disabled).toBeFalse();
    expect(activa('disabled(')).toBeFalse();
  });

  it('cifrar muestra la clave, y su regla saca al repetidor del aire', async () => {
    await tocar(1);
    expect(clave()).not.toBeNull();
    expect(component.alAire()).toBeFalse();
    expect(error()).toBe('Falta la clave');
    expect(activa('required(')).toBeTrue();

    await escribir(clave()!, 'gema');
    expect(component.alAire()).toBeTrue();
    expect(error()).toBe('');
  });

  it('mover el dial rompe y arregla una clave que nadie tocó', async () => {
    await tocar(1);
    await escribir(clave()!, 'x100');
    expect(component.alAire()).toBeTrue();

    await escribir(dial(), '100');
    expect(error()).toBe('Contiene la frecuencia');
    expect(component.alAire()).toBeFalse();
    expect(activa('validate(')).toBeTrue();

    await escribir(dial(), '101');
    expect(error()).toBe('');
    expect(component.alAire()).toBeTrue();
  });

  it('volver a ocultar la clave inválida devuelve el panel al aire y conserva el valor', async () => {
    await tocar(1);
    await escribir(clave()!, '98');
    expect(component.alAire()).toBeFalse();

    await tocar(1);
    expect(component.alAire()).toBeTrue();
    expect(component.modelo().clave).toBe('98');
  });

  it('la frecuencia cambia el ritmo de las ondas', async () => {
    const antes = component.cicloDeOnda();
    await escribir(dial(), '108');
    expect(parseFloat(component.cicloDeOnda())).toBeLessThan(parseFloat(antes));
  });

  it('cierra con el desafío de la regla que se lee una sola vez', () => {
    expect(host.querySelector('app-manipulable-system')).not.toBeNull();
  });
});
