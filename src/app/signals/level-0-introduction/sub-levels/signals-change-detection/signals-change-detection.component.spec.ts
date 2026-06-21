import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SignalsChangeDetectionComponent } from './signals-change-detection.component';

describe('SignalsChangeDetectionComponent', () => {
  let component: SignalsChangeDetectionComponent;
  let fixture: ComponentFixture<SignalsChangeDetectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalsChangeDetectionComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalsChangeDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza la tarjeta de concepto sobre signals', () => {
    const card = fixture.nativeElement.querySelector('app-concept-card');
    expect(card).toBeTruthy();
    expect((card as HTMLElement).textContent).toContain('signals');
  });

  it('muestra la imagen comparativa NgZone vs signals con su alt accesible', () => {
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('ng_zone_vs_signal.gif');
    expect(img.getAttribute('alt')).toContain('NgZone');
  });
});
