import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomToPixelComponent } from './dom-to-pixel.component';

describe('DomToPixelComponent', () => {
  let fixture: ComponentFixture<DomToPixelComponent>;
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
  const hueco = () => el.querySelector('.dtp-hueco');
  const etapas = () => [...el.querySelectorAll('.pm-etapa')];
  const pantalla = () => el.querySelector('app-escena-costo svg')?.getAttribute('aria-label') ?? '';
  const mano = () => (fixture.componentInstance as unknown as { guia: () => string | null }).guia();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DomToPixelComponent] }).compileComponents();
    fixture = TestBed.createComponent(DomToPixelComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: su dibujo y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .pmp')).not.toBeNull();
    expect(el.querySelector('.dtp-codigo')).toBeNull();
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .dtp-codigo')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-costo')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .dtp-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
      expect(el.querySelector('app-manipulable-system')).toBeNull();
    });

    it('arranca moviendo la nave con left, y el hueco rota la propiedad', () => {
      expect(hueco()?.textContent).toContain('style.left');
      click('.dtp-hueco');
      expect(hueco()?.textContent).toContain('textContent');
      expect(hueco()?.classList).not.toContain('dtp-hueco--barato');
    });

    it('antes de correr, la pantalla muestra el pipeline quieto', () => {
      expect(pantalla()).toContain('quieto');
    });

    it('con left, el cuadro pasa por layout y paint: caro, y se prende el arreglo', () => {
      click('.dtp-correr');
      expect(pantalla()).toContain('left pasa por style, layout, paint, composite');
      expect(pantalla()).toContain('caro');
      expect(etapas()[0].classList).toContain('pm-etapa--hecho');
      expect(etapas()[1].classList).toContain('pm-etapa--ahora');
    });

    it('al cambiar la propiedad, la pantalla no sigue mostrando la corrida anterior', () => {
      click('.dtp-correr');
      expect(pantalla()).toContain('left pasa por');
      click('.dtp-hueco');
      expect(pantalla()).toContain('textContent todavía no corrió');
      expect(pantalla()).not.toContain('left');
      click('.dtp-correr');
      expect(pantalla()).toContain('textContent pasa por');
    });

    it('con transform salta las capas caras y se resuelve recién al correr', () => {
      click('.dtp-correr');
      click('.dtp-hueco');
      click('.dtp-hueco');
      click('.dtp-hueco');
      expect(hueco()?.classList).toContain('dtp-hueco--barato');
      expect(etapas()[1].classList).not.toContain('pm-etapa--hecho');
      click('.dtp-correr');
      expect(pantalla()).toContain('transform pasa por style, composite');
      expect(pantalla()).toContain('barato');
      expect(etapas()[1].classList).toContain('pm-etapa--hecho');
    });

    it('la mano dice lo mismo que los pasos: correr y el hueco, hasta transform', () => {
      const toques: string[] = [];
      for (let i = 0; i < 10 && mano() !== null; i++) {
        const sigue = mano()!;
        toques.push(sigue);
        click(sigue);
      }
      expect(toques).toEqual([
        '.dtp-correr[data-cuenta="0"]',
        '[data-guia="propiedad"]',
        '.dtp-correr[data-cuenta="1"]',
        '[data-guia="propiedad"]',
        '.dtp-correr[data-cuenta="2"]',
        '[data-guia="propiedad"]',
        '.dtp-correr[data-cuenta="3"]',
      ]);
      expect(mano()).toBeNull();
    });
  });
});
