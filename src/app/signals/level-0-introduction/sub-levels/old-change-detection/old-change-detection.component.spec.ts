import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OldChangeDetectionComponent } from './old-change-detection.component';

describe('OldChangeDetectionComponent', () => {
  let fixture: ComponentFixture<OldChangeDetectionComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OldChangeDetectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OldChangeDetectionComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('dibuja los 7 nodos del árbol, ninguno barrido al inicio', () => {
    expect(el.querySelectorAll('.ocd-node').length).toBe(7);
    expect(el.querySelectorAll('.ocd-node.ocd-swept').length).toBe(0);
  });

  it('disparar una API parcheada re-chequea el árbol entero', () => {
    (el.querySelector('.ocd-api') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.ocd-node.ocd-swept').length).toBe(7);
    expect(el.querySelector('.ocd-count strong')!.textContent).toContain('7 / 7');
  });
});
