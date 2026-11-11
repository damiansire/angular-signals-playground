import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PAGINA_DEL_MANUAL } from '../../manual/pagina-del-manual';
import { VueloDeLaNave } from '../../manual/vuelo-de-la-nave';
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
  /** "Leer": la portada se va con una animación corta y recién después aparece la demo. */
  const leer = async () => {
    click('.pm-leer');
    await new Promise((listo) => setTimeout(listo, 450));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlToTreeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HtmlToTreeComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('abre con la portada: el árbol armado y "Leer", sin la demo', async () => {
    expect(el.querySelector('.pm-portada .htt-portada')).not.toBeNull();
    expect(el.querySelectorAll('.htt-portada-nodo').length).toBe(NODOS.length);
    expect(el.querySelector('.htt-codigo')?.isConnected ?? false).toBeFalse();
    expect(mano()).toBe('[data-guia="abre-main"]');
    await leer();
    expect(el.querySelector('.pm-portada')).toBeNull();
    expect(el.querySelector('.pm-pantalla .htt-codigo')).not.toBeNull();
    expect(el.querySelector('.pm-globo .pm-etapa--ahora')).not.toBeNull();
  });

  describe('con la portada abierta', () => {
    beforeEach(leer);

    it('es una sola pieza: escena, pantalla y sin desafío aparte', () => {
      expect(el.querySelector('.pm-escenario app-escena-arbol')).not.toBeNull();
      expect(el.querySelector('.pm-pantalla .htt-codigo')).not.toBeNull();
      expect(el.querySelector('.pm-consola')).toBeNull();
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
      expect(el.querySelector('[data-guia="abre-main"]')?.getAttribute('aria-pressed')).toBe(
        'true',
      );
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

    it('con las flechas el cierre baja de a un renglón: a medias, solo el párrafo queda afuera', () => {
      tocarTodos();
      const tecla = (key: string) => {
        el.querySelector('[data-guia="cierre"]')!.dispatchEvent(
          new KeyboardEvent('keydown', { key, cancelable: true }),
        );
        fixture.detectChanges();
      };
      tecla('ArrowDown');
      let r = renglones();
      expect(r.indexOf('</article>')).toBe(r.indexOf('<h3>Título</h3>') + 1);
      expect(pantalla()).toContain('1 fuera de su panel');
      tecla('ArrowDown');
      r = renglones();
      expect(r.indexOf('</article>')).toBe(r.indexOf('<p>Texto</p>') + 1);
      expect(pantalla()).toBe('Pantalla de la nave: 7 de 7 piezas');
      tecla('ArrowDown');
      expect(renglones().indexOf('</article>')).toBe(r.indexOf('</article>'));
      tecla('ArrowUp');
      tecla('ArrowUp');
      expect(renglones()).toContain('<article></article>');
    });

    it('arrastrar el cierre hasta debajo del párrafo lo deja ahí, y soltarlo no lo devuelve', () => {
      tocarTodos();
      const cierre = el.querySelector('[data-guia="cierre"]') as HTMLButtonElement;
      const parrafo = el.querySelector('.htt-linea[data-abre="p2"]')!.getBoundingClientRect();
      const desde = cierre.getBoundingClientRect();
      const puntero = (tipo: string, y: number) =>
        cierre.dispatchEvent(
          new PointerEvent(tipo, { pointerId: 1, button: 0, clientY: y, bubbles: true }),
        );
      puntero('pointerdown', desde.top + 2);
      puntero('pointermove', parrafo.bottom - 4);
      fixture.detectChanges();
      expect(el.querySelector('.htt-linea--destino-debajo')?.getAttribute('data-abre')).toBe('p2');
      puntero('pointerup', parrafo.bottom - 4);
      cierre.click();
      fixture.detectChanges();
      const r = renglones();
      expect(r.indexOf('</article>')).toBe(r.indexOf('<p>Texto</p>') + 1);
      expect(el.querySelector('.htt-linea--destino-debajo')).toBeNull();
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
});

describe('HtmlToTreeComponent en el libro', () => {
  it('"Siguiente" llega con la página cumplida, y pasa de hoja después de que la nave despega', async () => {
    const cumplida = signal(false);
    const pasar = jasmine.createSpy('pasar');
    TestBed.configureTestingModule({
      imports: [HtmlToTreeComponent],
      providers: [
        {
          provide: PAGINA_DEL_MANUAL,
          useValue: {
            numero: 1,
            ley: 'El HTML es un árbol de nodos.',
            enLaNave: 'La pantalla de la nave es un árbol.',
            pasar,
            atras: () => 'Bitácora',
            siguiente: () => (cumplida() ? 'Siguiente página' : null),
          },
        },
      ],
    });
    const despegar = spyOn(TestBed.inject(VueloDeLaNave), 'despegar').and.callThrough();
    const fixture = TestBed.createComponent(HtmlToTreeComponent);
    const el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    (el.querySelector('.pm-leer') as HTMLButtonElement).click();
    await new Promise((listo) => setTimeout(listo, 450));
    fixture.detectChanges();
    expect(el.querySelector('.pm-atras')?.textContent).toContain('Bitácora');
    expect(el.querySelector('.pm-seguir')).toBeNull();

    cumplida.set(true);
    fixture.detectChanges();
    const seguir = el.querySelector('.pm-seguir') as HTMLButtonElement;
    expect(seguir.textContent).toContain('Siguiente página');
    seguir.click();
    seguir.click();
    expect(despegar).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    await new Promise((listo) => setTimeout(listo, 1700));
    expect(pasar).toHaveBeenCalledOnceWith(1);
  });
});
