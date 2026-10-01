import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomToPixelComponent } from './dom-to-pixel.component';

describe('DomToPixelComponent', () => {
  let fixture: ComponentFixture<DomToPixelComponent>;
  let component: DomToPixelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DomToPixelComponent] }).compileComponents();
    fixture = TestBed.createComponent(DomToPixelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('dibuja las cinco estaciones del pipeline', () => {
    const stations = fixture.nativeElement.querySelectorAll('.dtp-pipe .dtp-station');
    expect(stations.length).toBe(5);
  });

  it('marca DOM como la fuente', () => {
    const source = fixture.nativeElement.querySelectorAll('.dtp-station.dtp-source');
    expect(source.length).toBe(1);
  });

  it('por defecto (cambiar texto) enciende las 4 etapas posteriores al DOM', () => {
    const on = fixture.nativeElement.querySelectorAll('.dtp-station.dtp-on');
    expect(on.length).toBe(4);
  });

  describe('pipeline vertical (angosto)', () => {
    const elegir = (rotulo: string): void => {
      const botones: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll('.dtp-btn')];
      botones.find((b) => b.textContent?.trim() === rotulo)!.click();
      fixture.detectChanges();
    };
    const salto = (): HTMLElement | null => fixture.nativeElement.querySelector('.dtp-vhop');

    it('tiene las mismas cinco estaciones, con DOM como fuente', () => {
      const estaciones = fixture.nativeElement.querySelectorAll('.dtp-vpipe .dtp-vst');
      expect(estaciones.length).toBe(5);
      expect(estaciones[0].classList).toContain('dtp-source');
    });

    it('cambiar el texto recorre la cadena entera: sin salto y todos los tramos llenos', () => {
      expect(salto()).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.dtp-vst--directo').length).toBe(4);
    });

    it('transform salta de style a composite: el arco abarca de la fila 2 a la 5', () => {
      elegir('Mover con transform');
      expect(salto()?.style.gridRow).toBe('2 / 6');
      expect(fixture.nativeElement.querySelectorAll('.dtp-vpipe .dtp-skip').length).toBe(2);
    });

    it('color salta solo layout: el arco va de style a paint', () => {
      elegir('Cambiar color');
      expect(salto()?.style.gridRow).toBe('2 / 5');
    });

    it('el flujo se dibuja en orden: el arco toma su turno entre los tramos', () => {
      elegir('Cambiar color');
      const estaciones: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('.dtp-vst')];
      expect(estaciones[0].style.getPropertyValue('--d')).toBe('0s');
      expect(salto()?.style.getPropertyValue('--d')).toBe('0.14s');
      // paint -> composite espera a que termine el arco (0.14 + 0.4).
      expect(estaciones[3].style.getPropertyValue('--d')).toBe('0.54s');
    });
  });
});
