import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignalsChangeDetectionComponent } from './signals-change-detection.component';

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
});
