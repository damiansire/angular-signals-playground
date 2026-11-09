import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualSyncPainComponent } from './manual-sync-pain.component';

describe('ManualSyncPainComponent', () => {
  let fixture: ComponentFixture<ManualSyncPainComponent>;
  let el: HTMLElement;

  const click = (selector: string) => {
    (el.querySelector(selector) as HTMLButtonElement).click();
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

  it('es una sola pieza: escena, consola y sin desafío aparte', () => {
    expect(el.querySelector('.pm-escenario app-escena-a-mano')).not.toBeNull();
    expect(el.querySelector('.pm-consola .msp-codigo')).not.toBeNull();
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

  it('el panel de la nave dice qué quedó viejo', () => {
    click('.msp-inc');
    const panel = el.querySelector('app-escena-a-mano svg')?.getAttribute('aria-label') ?? '';
    expect(panel).toContain('#mult2 Sí (viejo)');
    expect(panel).toContain('#mult3 Sí (viejo)');
  });
});
