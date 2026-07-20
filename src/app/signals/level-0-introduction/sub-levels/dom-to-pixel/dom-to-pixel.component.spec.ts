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
});
