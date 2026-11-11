import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignalsChangeDetectionComponent } from './signals-change-detection.component';

describe('SignalsChangeDetectionComponent', () => {
  let fixture: ComponentFixture<SignalsChangeDetectionComponent>;
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
  const pantalla = () =>
    el.querySelector('app-escena-signal svg')?.getAttribute('aria-label') ?? '';
  const codigo = () => el.querySelector('.scd-codigo')?.textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalsChangeDetectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SignalsChangeDetectionComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: su dibujo y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .pmp')).not.toBeNull();
    expect(el.querySelector('.scd-codigo')).toBeNull();
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .scd-codigo')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-signal')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .scd-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
      expect(el.querySelector('app-manipulable-system')).toBeNull();
    });

    it('arranca con una variable común, y el hueco la vuelve signal con su escritura', () => {
      expect(codigo()).toContain('let total = 0;');
      expect(codigo()).toContain('total++;');
      click('.scd-hueco');
      expect(codigo()).toContain('const total = signal(0);');
      expect(codigo()).toContain('total.update((t) => t + 1);');
      expect(el.querySelector('.scd-hueco')?.classList).toContain('scd-hueco--signal');
    });

    it('con la variable común, se revisa el árbol entero y se prende el paso de arreglar', () => {
      expect(pantalla()).toContain('0 de 7 nodos revisados');
      click('.scd-correr');
      expect(pantalla()).toContain('total 1,');
      expect(pantalla()).toContain('7 de 7 nodos revisados');
      expect(etapas()[0].classList).toContain('pm-etapa--hecho');
      expect(etapas()[1].classList).toContain('pm-etapa--ahora');
    });

    it('con el signal, se enteran solo los dos que lo leen y se resuelve', () => {
      click('.scd-correr');
      click('.scd-hueco');
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
      click('.scd-correr');
      expect(pantalla()).toContain('total 2,');
      expect(pantalla()).toContain('2 de 7 nodos revisados');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
    });

    it('volver a la variable común deja de estar resuelta', () => {
      click('.scd-hueco');
      click('.scd-correr');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
      click('.scd-hueco');
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
    });

    it('la mano dice lo mismo que los pasos: correr, el hueco, correr', () => {
      const mano = () =>
        (fixture.componentInstance as unknown as { guia: () => string | null }).guia();
      expect(mano()).toBe('.scd-correr[data-cuenta="0"]');
      click('.scd-correr');
      expect(mano()).toBe('[data-guia="declaracion"]');
      click('.scd-hueco');
      expect(mano()).toBe('.scd-correr[data-cuenta="1"]');
      click('.scd-correr');
      expect(mano()).toBeNull();
    });
  });
});
