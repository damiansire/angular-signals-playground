import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HtmlToTreeComponent } from './html-to-tree.component';
import { NODOS } from './html-to-tree.data';

describe('HtmlToTreeComponent', () => {
  let fixture: ComponentFixture<HtmlToTreeComponent>;
  let el: HTMLElement;

  const click = (selector: string) => {
    (el.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const tocarTodos = () => NODOS.forEach((id) => click(`[data-guia="abre-${id}"]`));
  const etapas = () => [...el.querySelectorAll('.pm-etapa')];
  const pantalla = () => el.querySelector('app-escena-arbol svg')?.getAttribute('aria-label') ?? '';
  const renglones = () =>
    [...el.querySelectorAll('.htt-linea')].map((r) => (r.textContent ?? '').replace(/\s+/g, ''));
  const mano = () => (fixture.componentInstance as unknown as { guia: () => string | null }).guia();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlToTreeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HtmlToTreeComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('es una sola pieza: escena, consola y sin desafío aparte', () => {
    expect(el.querySelector('.pm-escenario app-escena-arbol')).not.toBeNull();
    expect(el.querySelector('.pm-consola .htt-codigo')).not.toBeNull();
    expect(el.querySelector('app-manipulable-system')).toBeNull();
    expect(el.querySelector('app-code')).toBeNull();
  });

  it('arranca con el bug: `</article>` cerrado enseguida y la pantalla vacía', () => {
    expect(renglones()).toContain('<article></article>');
    expect(el.querySelectorAll('.htt-tag').length).toBe(NODOS.length);
    expect(pantalla()).toContain('0 de 7 piezas');
  });

  it('cada tag revela su pieza; el título y el párrafo caen fuera de su panel', () => {
    click('[data-guia="abre-main"]');
    expect(pantalla()).toContain('1 de 7 piezas');
    expect(el.querySelector('[data-guia="abre-main"]')?.getAttribute('aria-pressed')).toBe('true');
    tocarTodos();
    expect(pantalla()).toContain('7 de 7 piezas, 2 fuera de su panel');
    expect(etapas()[0].classList).toContain('pm-etapa--hecho');
    expect(etapas()[1].classList).toContain('pm-etapa--ahora');
  });

  it('mover el cierre lo lleva después del párrafo, y sana', () => {
    tocarTodos();
    click('[data-guia="cierre"]');
    const r = renglones();
    expect(r).toContain('<article>');
    expect(r.indexOf('</article>')).toBe(r.indexOf('<p>Texto</p>') + 1);
    expect(pantalla()).toBe('Pantalla de la nave: 7 de 7 piezas');
    expect(etapas()[1].classList).toContain('pm-etapa--hecho');
  });

  it('la mano dice lo mismo que los pasos: cada tag en orden y después el hueco', () => {
    for (const id of NODOS) {
      expect(mano()).toBe(`[data-guia="abre-${id}"]`);
      click(`[data-guia="abre-${id}"]`);
    }
    expect(mano()).toBe('[data-guia="cierre"]');
    click('[data-guia="cierre"]');
    expect(mano()).toBeNull();
  });
});
