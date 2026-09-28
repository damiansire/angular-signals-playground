import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ManipulableSystemComponent } from './manipulable-system.component';
import { ManipulableChallenge, SISTEMA_ESTABLECIDO } from '../../libs/manipulable-challenge';

/**
 * Este componente renderiza los 37 cierres del recorrido y es la ÚNICA fuente del evento con el
 * que el recorrido marca que un concepto quedó establecido. Ese contrato cruza dos capas que no se
 * conocen (el átomo y el motor de la vista integrada) y no estaba cubierto en ninguna de las dos
 * puntas: si dejaba de emitirse, el recorrido simplemente no marcaba avance, sin ningún error.
 */
describe('ManipulableSystemComponent', () => {
  /** Perilla de 3 posiciones; el sistema queda sano recién en la última. */
  const TRES_POSICIONES: ManipulableChallenge = {
    knobs: [{ id: 'p', positions: 3, label: 'la perilla' }],
    gauges: [{ id: 'v', label: 'v' }],
    action: 'accionar',
    start: { v: 0 },
    code: (knobs) => [{ text: `  p=${knobs['p']}`, knob: 'p' }],
    settle: (s) => ({ v: s.knobs['p'] }),
    healthy: (s) => s.knobs['p'] === 2,
  };

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ManipulableSystemComponent],
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function crear(system: ManipulableChallenge = TRES_POSICIONES) {
    const fixture = TestBed.createComponent(ManipulableSystemComponent);
    fixture.componentRef.setInput('system', system);
    fixture.detectChanges();
    return fixture;
  }

  it('arranca sin correr: ni averiado ni sano hasta accionarlo', () => {
    const c = crear().componentInstance;
    expect(c.health()).toBe('idle');
    expect(c.healthy()).toBeFalse();
  });

  it('girar la perilla vuelve a una corrida sin correr, aunque haya accionado antes', () => {
    const c = crear().componentInstance;
    c.press();
    expect(c.health()).toBe('broken');

    c.move('p');
    c.move('p'); // el código sano, pero todavía sin accionar
    expect(c.health()).toBe('idle');

    c.press();
    expect(c.health()).toBe('healthy');
  });

  describe('tono de la lectura', () => {
    function clasesDeLaLectura(fixture: ReturnType<typeof crear>): string {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.ms__gauge')!.className;
    }

    it('sin correr no es rojo ni verde', () => {
      const clases = clasesDeLaLectura(crear());
      expect(clases).toContain('ms__gauge--idle');
      expect(clases).not.toContain('ms__gauge--ok');
    });

    it('accionado con el código roto pierde el tono neutro', () => {
      const fixture = crear();
      fixture.componentInstance.press();
      const clases = clasesDeLaLectura(fixture);
      expect(clases).not.toContain('ms__gauge--idle');
      expect(clases).not.toContain('ms__gauge--ok');
    });

    it('accionado con el código sano se pinta de sano', () => {
      const fixture = crear();
      fixture.componentInstance.move('p');
      fixture.componentInstance.move('p');
      fixture.componentInstance.press();
      const clases = clasesDeLaLectura(fixture);
      expect(clases).toContain('ms__gauge--ok');
      expect(clases).not.toContain('ms__gauge--idle');
    });
  });

  it('la lectura sigue a la perilla', () => {
    const c = crear().componentInstance;
    expect(c.gauges().map((g) => g.value)).toEqual([0]);

    c.move('p');
    expect(c.gauges().map((g) => g.value)).toEqual([1]);
  });

  it('la sangría viaja aparte del cuerpo de la línea', () => {
    const [linea] = crear().componentInstance.lines();
    expect(linea.indent).toBe('  ');
    expect(linea.body).toBe('p=0');
  });

  it('knobLabel nombra la perilla para quien no ve la pantalla', () => {
    expect(crear().componentInstance.knobLabel('p')).toBe('la perilla');
    expect(crear().componentInstance.knobLabel('no-existe')).toBe('');
  });

  describe('evento de cierre', () => {
    function contarEventos(fixture: ReturnType<typeof crear>) {
      const vistos: Event[] = [];
      fixture.nativeElement.addEventListener(SISTEMA_ESTABLECIDO, (e: Event) => vistos.push(e));
      return vistos;
    }

    it('no avisa mientras el sistema sigue averiado', () => {
      const fixture = crear();
      const vistos = contarEventos(fixture);

      fixture.componentInstance.move('p'); // pasa a 1: todavía no está sano
      fixture.componentInstance.press();
      expect(vistos.length).toBe(0);
    });

    it('no avisa solo por girar al código sano: hay que accionarlo', () => {
      const fixture = crear();
      const vistos = contarEventos(fixture);

      fixture.componentInstance.press(); // corrida con el código roto
      fixture.componentInstance.move('p');
      fixture.componentInstance.move('p'); // código sano, corrida nueva sin accionar
      expect(vistos.length).toBe(0);
    });

    it('avisa al quedar sano', () => {
      const fixture = crear();
      const vistos = contarEventos(fixture);

      fixture.componentInstance.move('p');
      fixture.componentInstance.move('p');
      fixture.componentInstance.press(); // corre con el código sano
      expect(vistos.length).toBe(1);
    });

    it('avisa una sola vez: sale en la transición, no en cada toque', () => {
      const fixture = crear();
      const vistos = contarEventos(fixture);

      fixture.componentInstance.move('p');
      fixture.componentInstance.move('p');
      fixture.componentInstance.press(); // sano
      fixture.componentInstance.press(); // sigue sano, no vuelve a avisar
      expect(vistos.length).toBe(1);
    });

    it('burbujea: el motor lo escucha en un ancestro, no en el átomo', () => {
      const fixture = crear();
      const vistos: Event[] = [];
      document.addEventListener(SISTEMA_ESTABLECIDO, (e: Event) => vistos.push(e));
      document.body.appendChild(fixture.nativeElement);

      fixture.componentInstance.move('p');
      fixture.componentInstance.move('p');
      fixture.componentInstance.press();

      expect(vistos.length).toBe(1);
      expect(vistos[0].bubbles).toBeTrue();
      fixture.nativeElement.remove();
    });
  });
});
