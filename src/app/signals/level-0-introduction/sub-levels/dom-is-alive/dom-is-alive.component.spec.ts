import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomIsAliveComponent } from './dom-is-alive.component';

describe('DomIsAliveComponent', () => {
  let fixture: ComponentFixture<DomIsAliveComponent>;
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
  const pantalla = () => el.querySelector('app-escena-vivo svg')?.getAttribute('aria-label') ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DomIsAliveComponent] }).compileComponents();
    fixture = TestBed.createComponent(DomIsAliveComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: su dibujo y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .pmp')).not.toBeNull();
    expect(el.querySelector('.dia-codigo')).toBeNull();
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .dia-codigo')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-vivo')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .dia-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
      expect(el.querySelector('app-manipulable-system')).toBeNull();
      expect(el.querySelector('.dia-dom')).toBeNull();
    });

    it('la pantalla de la nave muestra los tres nodos con su selector', () => {
      expect(pantalla()).toContain('h1 Contador');
      expect(pantalla()).toContain('#count 0');
      expect(pantalla()).toContain('#status inactivo');
    });

    it('arranca con un selector que no está, y el hueco lo rota', () => {
      expect(el.querySelector('.dia-sel')?.textContent).toBe("'#titulo'");
      click('.dia-hueco');
      expect(el.querySelector('.dia-sel')?.textContent).toBe("'h1'");
      expect(el.querySelector('.dia-hueco')?.classList).toContain('dia-hueco--encuentra');
    });

    it('con el selector roto, dos nodos cambian y el título da null', () => {
      click('.dia-correr');
      expect(pantalla()).toContain('#count 1');
      expect(pantalla()).toContain('#status activo');
      expect(pantalla()).toContain('h1 Contador');
      expect(pantalla()).toContain('#titulo no encontró nada (null)');
      expect(el.querySelector('.dia-linea:not(.dia-molde) .dia-null')).not.toBeNull();
      expect(etapas()[1].classList).toContain('pm-etapa--ahora');
      expect(etapas()[0].classList).toContain('pm-etapa--hecho');
    });

    it('el paso de arreglar nombra el último selector que dio null', () => {
      expect(etapas()[1].textContent).toContain("'#titulo'");
      click('.dia-hueco');
      click('.dia-hueco');
      click('.dia-correr');
      expect(etapas()[1].textContent).toContain("'.titulo'");
    });

    it('con h1, el título cambia y se resuelve', () => {
      click('.dia-correr');
      click('.dia-hueco');
      expect(el.querySelector('.dia-linea:not(.dia-molde) .dia-null')).toBeNull();
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
      click('.dia-correr');
      expect(pantalla()).toContain('h1 Listo');
      expect(pantalla()).not.toContain('null');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
    });

    it('la mano dice lo mismo que los pasos: correr, el hueco, correr', () => {
      const mano = () =>
        (fixture.componentInstance as unknown as { guia: () => string | null }).guia();
      expect(mano()).toBe('.dia-correr[data-cuenta="0"]');
      click('.dia-correr');
      expect(mano()).toBe('[data-guia="selector"]');
      click('.dia-hueco');
      expect(mano()).toBe('.dia-correr[data-cuenta="1"]');
      click('.dia-hueco');
      expect(mano()).toBe('[data-guia="selector"]');
      click('.dia-hueco');
      click('.dia-hueco');
      click('.dia-correr');
      expect(mano()).toBeNull();
    });
  });
});
