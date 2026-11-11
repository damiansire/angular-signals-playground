import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { hasta } from '../testing/cuadros';
import { AvisoAuricularesComponent } from './aviso-auriculares.component';

describe('AvisoAuricularesComponent al retomar', () => {
  let pantalla: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AvisoAuricularesComponent],
      providers: [provideZonelessChangeDetection()],
    });
    // La pantalla de inicio, como la deja la vista: se desvanece con una transición al irse.
    pantalla = document.body.appendChild(document.createElement('div'));
    pantalla.style.transition = 'opacity 120ms';
  });

  afterEach(() => pantalla.remove());

  async function retomar(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(AvisoAuricularesComponent);
    pantalla.appendChild(fixture.nativeElement);
    fixture.componentRef.setInput('retoma', true);
    fixture.componentInstance.retomar.subscribe(() => {
      pantalla.classList.add('gone');
      pantalla.style.opacity = '0';
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    host.click();
    await fixture.whenStable();
    return host;
  }

  it('sigue a la vista mientras la pantalla se desvanece y se oculta cuando terminó', async () => {
    const host = await retomar();
    expect(host.hasAttribute('hidden')).withContext('con el fundido andando').toBeFalse();
    await hasta(() => host.hasAttribute('hidden'));
    expect(host.hasAttribute('hidden')).withContext('con el fundido terminado').toBeTrue();
  });
});
