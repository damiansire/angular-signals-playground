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

  it('renderiza el pipeline con las 4 etapas posteriores al DOM', () => {
    const stages = fixture.nativeElement.querySelectorAll(
      '.dtp-pipeline .dtp-stage:not(.dtp-source)',
    );
    expect(stages.length).toBe(4);
  });

  it('por defecto (cambiar texto) enciende las 4 etapas', () => {
    const on = fixture.nativeElement.querySelectorAll('.dtp-pipeline .dtp-stage.dtp-on');
    expect(on.length).toBe(4);
  });
});
