import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualSyncPainComponent } from './manual-sync-pain.component';

describe('ManualSyncPainComponent', () => {
  let fixture: ComponentFixture<ManualSyncPainComponent>;
  let el: HTMLElement;

  const click = (selector: string) => {
    (el.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const clickCompleteTab = () => {
    // Segundo tab = "handler completo" (por índice: "incompleto" contiene "completo" como substring).
    (el.querySelectorAll('.msp-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualSyncPainComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ManualSyncPainComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra los tres lugares del DOM', () => {
    expect(el.querySelectorAll('.msp-spot').length).toBe(3);
  });

  it('handler incompleto: al incrementar, los derivados quedan viejos', () => {
    click('.msp-inc');
    expect(el.querySelectorAll('.msp-spot.msp-stale').length).toBe(2);
    expect(el.querySelectorAll('.msp-badge').length).toBe(2);
  });

  it('handler completo: no queda nada viejo', () => {
    click('.msp-inc');
    clickCompleteTab();
    expect(el.querySelectorAll('.msp-spot.msp-stale').length).toBe(0);
  });
});
