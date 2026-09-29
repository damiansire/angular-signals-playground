import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { RatingComponent } from './rating.component';

describe('RatingComponent', () => {
  let component: RatingComponent;
  let fixture: ComponentFixture<RatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el model y notifica el cambio al padre', () => {
    const emitted: number[] = [];
    component.value.subscribe((value) => emitted.push(value));

    component.setValue(4);

    expect(component.value()).toBe(4);
    expect(emitted).toContain(4);
  });

  it('el puntaje se ve por forma, no solo por color, y la estrella elegida se anuncia', async () => {
    component.value.set(3);
    fixture.detectChanges();
    await fixture.whenStable();

    const stars = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(stars.map((b) => b.textContent!.trim())).toEqual(['★', '★', '★', '☆', '☆']);
    expect(stars.map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ]);
  });
});
