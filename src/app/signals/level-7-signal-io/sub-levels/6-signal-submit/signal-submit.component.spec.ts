import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SignalSubmitComponent } from './signal-submit.component';

describe('SignalSubmitComponent', () => {
  let component: SignalSubmitComponent;
  let fixture: ComponentFixture<SignalSubmitComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalSubmitComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalSubmitComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const input = (id: string) => host.querySelector<HTMLInputElement>(`#trs-${id}`)!;
  const errores = () =>
    Array.from(host.querySelectorAll('.trs-error span')).map((e) => e.textContent?.trim());

  async function escribir(id: string, valor: string) {
    input(id).value = valor;
    input(id).dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  /** Real timers on purpose: debounce, the resource and submit chain promises and timeouts. */
  async function hasta(condicion: () => boolean) {
    const limite = performance.now() + 4000;
    while (!condicion() && performance.now() < limite) {
      await new Promise((listo) => setTimeout(listo, 20));
    }
    await fixture.whenStable();
    expect(condicion()).withContext('la condición nunca se cumplió').toBeTrue();
  }

  const canalVerificado = () => hasta(() => component.etapa() === 'quieta');

  async function canalYMensaje(canal: string) {
    component.elegirCanal(canal);
    await escribir('mensaje', 'Hola');
    await canalVerificado();
  }

  it('enviar vacío marca los dos campos y no transmite nada', async () => {
    const salio = await component.transmitir();
    await fixture.whenStable();
    expect(salio).toBeFalse();
    expect(errores()).toEqual(['Falta el canal', 'Falta el mensaje']);
    expect(component.enviados()).toEqual([]);
    expect(component.retenidos()).toBe(1);
    expect(host.querySelector('.trs-retenida')).not.toBeNull();
  });

  it('Enter en el formulario transmite sin recargar la página', async () => {
    const envio = new Event('submit', { cancelable: true });
    host.querySelector('form')!.dispatchEvent(envio);
    await fixture.whenStable();
    expect(envio.defaultPrevented).toBeTrue();
    expect(component.retenidos()).toBe(1);
  });

  it('debounce deja el modelo atrás del input hasta que se dejan de tocar teclas', async () => {
    await escribir('canal', 'al');
    expect(component.transmision.canal().controlValue()).toBe('al');
    expect(component.modelo().canal).toBe('');
    expect(component.etapa()).toBe('debounce');

    await hasta(() => component.modelo().canal === 'al');
  });

  it('el canal ocupado se descubre verificando, sin enviar', async () => {
    await canalYMensaje('ruido');
    expect(errores()).toEqual(['Canal ocupado']);
    expect(await component.transmitir()).toBeFalse();
    expect(component.enviados()).toEqual([]);
  });

  it('mientras el canal se verifica, submit retiene la transmisión', async () => {
    await escribir('mensaje', 'Hola');
    component.elegirCanal('alfa');
    // Checked right here: whenStable() would wait for the validator this test needs still running.
    expect(component.etapa()).toBe('pending');

    expect(await component.transmitir()).toBeFalse();
    expect(component.enviados()).toEqual([]);
    expect(component.retenidos()).toBe(1);
  });

  it('con el canal libre transmite, pasa por submitting y deja el form limpio', async () => {
    await canalYMensaje('alfa');
    const envio = component.transmitir();
    expect(component.etapa()).toBe('submitting');
    await fixture.whenStable();
    expect(host.querySelector('.trs-pulso')).not.toBeNull();

    expect(await envio).toBeTrue();
    await fixture.whenStable();
    expect(component.enviados()).toEqual(['Hola']);
    expect(component.modelo()).toEqual({ canal: '', mensaje: '' });
    expect(component.transmision().touched()).toBeFalse();
    expect(host.querySelector('.trs-pulso')).toBeNull();
    expect(host.querySelector('.trs-enviado')?.textContent).toBe('Hola');
  });

  it('el error del envío vuelve al campo que lo causó y se va al corregirlo', async () => {
    await canalYMensaje('eco');
    const envio = component.transmitir();
    await fixture.whenStable();
    expect(host.querySelector('.trs-pulso--rebota')).not.toBeNull();
    await envio;
    await fixture.whenStable();

    expect(errores()).toEqual(['La señal rebotó']);
    expect(component.rebote()).toBeTrue();
    expect(component.enviados()).toEqual([]);
    expect(component.modelo().mensaje).toBe('Hola');

    component.elegirCanal('alfa');
    await canalVerificado();
    expect(component.rebote()).toBeFalse();
    expect(errores()).toEqual([]);
  });

  it('cierra con el desafío de transmitir sin esperar la verificación', () => {
    expect(host.querySelector('app-manipulable-system')).not.toBeNull();
  });
});
