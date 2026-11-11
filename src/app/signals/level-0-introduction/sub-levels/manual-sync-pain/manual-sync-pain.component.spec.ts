import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualSyncPainComponent } from './manual-sync-pain.component';

describe('ManualSyncPainComponent', () => {
  let fixture: ComponentFixture<ManualSyncPainComponent>;
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualSyncPainComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ManualSyncPainComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: su dibujo y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .pmp')).not.toBeNull();
    expect(el.querySelector('.msp-codigo')).toBeNull();
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .msp-codigo')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-a-mano')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .msp-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
      expect(el.querySelector('app-manipulable-system')).toBeNull();
    });

    it('el handler arranca con su hueco y lo tocado lo completa', () => {
      expect(el.querySelector('.msp-hueco')?.textContent).toContain('falta');
      click('.msp-hueco');
      expect(el.querySelector('.msp-hueco')?.textContent).toContain("'#mult3'");
      expect(el.querySelector('.msp-hueco')?.getAttribute('aria-pressed')).toBe('true');
    });

    it('con un lugar viejo se prende el paso de arreglar', () => {
      expect(etapas()[0].classList).toContain('pm-etapa--ahora');
      click('.msp-inc');
      expect(etapas()[1].classList).toContain('pm-etapa--ahora');
      expect(etapas()[0].classList).toContain('pm-etapa--hecho');
    });

    it('completar no alcanza: se resuelve al volver a sumar', () => {
      click('.msp-inc');
      click('.msp-hueco');
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
      click('.msp-inc');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
    });

    it('la mano dice lo mismo que los pasos: sumar, el hueco apenas algo queda viejo, sumar', () => {
      const mano = () =>
        (fixture.componentInstance as unknown as { guia: () => string | null }).guia();
      expect(mano()).toBe('.msp-inc[data-cuenta="0"]');
      click('.msp-inc');
      expect(mano()).toBe('[data-guia="completo"]');
      click('.msp-hueco');
      expect(mano()).toBe('.msp-inc[data-cuenta="1"]');
      click('.msp-inc');
      expect(mano()).toBeNull();
    });

    it('el panel de la nave dice qué quedó viejo', () => {
      click('.msp-inc');
      const panel = el.querySelector('app-escena-a-mano svg')?.getAttribute('aria-label') ?? '';
      expect(panel).toContain('#mult2 Sí (viejo)');
      expect(panel).toContain('#mult3 Sí (viejo)');
    });
  });
});
