import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OldChangeDetectionComponent } from './old-change-detection.component';

describe('OldChangeDetectionComponent', () => {
  let fixture: ComponentFixture<OldChangeDetectionComponent>;
  let el: HTMLElement;

  const click = (selector: string) => {
    (el.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  /** "Leer": la portada se va con una animación corta y recién después aparece la demo. */
  const leer = async () => {
    click('.pm-leer');
    await new Promise((listo) => setTimeout(listo, 450));
    fixture.detectChanges();
  };
  const etapas = () => [...el.querySelectorAll('.pm-etapa')];
  const pantalla = () => el.querySelector('app-escena-zona svg')?.getAttribute('aria-label') ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OldChangeDetectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OldChangeDetectionComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: su dibujo y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .pmp')).not.toBeNull();
    expect(el.querySelector('.ocd-codigo')).toBeNull();
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .ocd-codigo')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-zona')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .ocd-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
      expect(el.querySelector('app-manipulable-system')).toBeNull();
    });

    it('arranca con la API que Zone.js no parchea, y el hueco la rota', () => {
      expect(el.querySelector('.ocd-hueco')?.textContent).toContain('requestIdleCallback');
      click('.ocd-hueco');
      expect(el.querySelector('.ocd-hueco')?.textContent).toContain('setTimeout');
      expect(el.querySelector('.ocd-hueco')?.classList).toContain('ocd-hueco--parcheada');
    });

    it('sin parche, el valor cambia pero la pantalla queda vieja y nadie revisa', () => {
      click('.ocd-correr');
      expect(pantalla()).toContain('total 0 (viejo)');
      expect(pantalla()).toContain('0 de 7 nodos revisados');
      expect(etapas()[1].classList).toContain('pm-etapa--ahora');
      expect(etapas()[0].classList).toContain('pm-etapa--hecho');
    });

    it('con una API parcheada, revisa los siete y se resuelve', () => {
      click('.ocd-correr');
      click('.ocd-hueco');
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
      click('.ocd-correr');
      expect(pantalla()).toContain('total 2,');
      expect(pantalla()).toContain('7 de 7 nodos revisados');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
    });

    it('la mano dice lo mismo que los pasos: correr, el hueco, correr', () => {
      const mano = () =>
        (fixture.componentInstance as unknown as { guia: () => string | null }).guia();
      expect(mano()).toBe('.ocd-correr[data-cuenta="0"]');
      click('.ocd-correr');
      expect(mano()).toBe('[data-guia="api"]');
      click('.ocd-hueco');
      expect(mano()).toBe('.ocd-correr[data-cuenta="1"]');
      click('.ocd-correr');
      expect(mano()).toBeNull();
    });
  });
});
