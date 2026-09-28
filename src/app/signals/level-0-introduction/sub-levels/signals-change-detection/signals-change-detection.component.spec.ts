import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignalsChangeDetectionComponent } from './signals-change-detection.component';
import { malformed } from '../../../../libs/manipulable-challenge';
import { SIGNAL_NOTIFY_SYSTEM } from '../../introduction-systems';

describe('SignalsChangeDetectionComponent', () => {
  let fixture: ComponentFixture<SignalsChangeDetectionComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalsChangeDetectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SignalsChangeDetectionComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al inicio ningún nodo está encendido ni podado', () => {
    expect(el.querySelectorAll('.scd-node').length).toBe(7);
    expect(el.querySelectorAll('.scd-node.scd-lit').length).toBe(0);
    expect(el.querySelectorAll('.scd-node.scd-pruned').length).toBe(0);
  });

  it('cambiar el signal re-chequea solo los dependientes y poda el resto', () => {
    (el.querySelector('.scd-change') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.scd-node.scd-lit').length).toBe(2);
    expect(el.querySelectorAll('.scd-node.scd-pruned').length).toBe(5);
    expect(el.querySelector('.scd-count strong')!.textContent).toContain('2 / 7');
  });

  // Se mide lo dibujado y no el ancho calculado: el defecto era que el texto real se salía del
  // nodo, y solo el browser sabe cuánto ocupa la fuente que terminó usando.
  describe('cada rótulo entra en su nodo', () => {
    const cajas = () =>
      Array.from(el.querySelectorAll('.scd-node')).map((node) => ({
        rotulo: node.querySelector('text')!.textContent!.trim(),
        texto: node.querySelector('text')!.getBoundingClientRect(),
        forma: node.querySelector('rect')!.getBoundingClientRect(),
      }));

    const adentro = () => {
      for (const { rotulo, texto, forma } of cajas()) {
        expect(texto.left).withContext(`${rotulo} por izquierda`).toBeGreaterThan(forma.left);
        expect(texto.right).withContext(`${rotulo} por derecha`).toBeLessThan(forma.right);
      }
    };

    it('en reposo', () => {
      expect(cajas().length).toBe(7);
      adentro();
    });

    it('encendido, que pasa el rótulo a negrita', () => {
      (el.querySelector('.scd-change') as HTMLButtonElement).click();
      fixture.detectChanges();
      adentro();
    });

    it('ningún nodo pisa a otro', () => {
      const formas = cajas();
      for (const a of formas) {
        for (const b of formas) {
          if (a === b) continue;
          const pisa =
            a.forma.left < b.forma.right &&
            b.forma.left < a.forma.right &&
            a.forma.top < b.forma.bottom &&
            b.forma.top < a.forma.bottom;
          expect(pisa).withContext(`${a.rotulo} contra ${b.rotulo}`).toBeFalse();
        }
      }
    });
  });
});

describe('desafío 0/6 · el signal avisa quién lo lee', () => {
  const codigo = (posicion: number) =>
    SIGNAL_NOTIFY_SYSTEM.code({ perilla: posicion }).map((line) => line.text);

  it('sigue bien armado', () => {
    expect(malformed(SIGNAL_NOTIFY_SYSTEM)).toEqual([]);
  });

  // La avería tiene que ser código que alguien escribiría: con `let`, un number no tiene .set.
  it('con una variable común, la escritura es una asignación', () => {
    expect(codigo(0)).toContain('total = 42;');
    expect(codigo(0).some((line) => line.includes('.set('))).toBeFalse();
  });

  it('con el signal, la escritura pasa por set', () => {
    expect(codigo(1)).toContain('total.set(42);');
    expect(codigo(1)).not.toContain('total = 42;');
  });
});
