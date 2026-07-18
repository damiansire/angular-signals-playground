import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { createOptions } from './create-options';

interface Opts {
  appearance: 'primary' | 'secondary';
  size: 's' | 'm' | 'l';
}
const DEFAULTS: Opts = { appearance: 'primary', size: 'm' };

describe('createOptions / provideOptions (opciones en cascada estilo Taiga)', () => {
  it('el token resuelve a los defaults cuando nadie lo provee (factory del token)', () => {
    const [TOKEN] = createOptions(DEFAULTS);
    TestBed.configureTestingModule({});
    expect(TestBed.inject(TOKEN)).toEqual(DEFAULTS);
  });

  it('un provider mergea el override local con los defaults', () => {
    const [TOKEN, provide] = createOptions(DEFAULTS);
    const injector = Injector.create({ providers: [provide({ size: 'l' })] });
    expect(injector.get(TOKEN)).toEqual({ appearance: 'primary', size: 'l' });
  });

  it('cascada: el hijo HEREDA las opciones del ancestro (skipSelf) y aplica su override', () => {
    // Lo que distingue este patrón de un InjectionToken simple: el `skipSelf` sube al ancestro.
    const [TOKEN, provide] = createOptions(DEFAULTS);
    const parent = Injector.create({ providers: [provide({ appearance: 'secondary' })] });
    const child = Injector.create({ providers: [provide({ size: 'l' })], parent });
    // el hijo resuelve `appearance` heredado del ancestro Y su `size` propio
    expect(child.get(TOKEN)).toEqual({ appearance: 'secondary', size: 'l' });
    // el ancestro conserva su `size` default; el override del hijo no lo afecta hacia arriba
    expect(parent.get(TOKEN)).toEqual({ appearance: 'secondary', size: 'm' });
  });

  it('acepta el override como función (rama options())', () => {
    const [TOKEN, provide] = createOptions(DEFAULTS);
    const injector = Injector.create({ providers: [provide(() => ({ size: 'l' }))] });
    expect(injector.get(TOKEN)).toEqual({ appearance: 'primary', size: 'l' });
  });
});
