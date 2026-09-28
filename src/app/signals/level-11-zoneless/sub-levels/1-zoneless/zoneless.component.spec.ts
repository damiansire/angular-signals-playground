import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ZonelessComponent } from './zoneless.component';

describe('ZonelessComponent', () => {
  let component: ZonelessComponent;
  let fixture: ComponentFixture<ZonelessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonelessComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonelessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el computed deriva del signal', () => {
    component.increment();
    component.increment();
    expect(component.count()).toBe(2);
    expect(component.double()).toBe(4);
  });

  // Desde v21 zoneless viene de fábrica: mostrar el provider como el interruptor enseña a
  // prender algo que ya está prendido.
  it('el código de la demo no presenta zoneless como opt-in', () => {
    const codigo = component
      .lines()
      .map((l) => l.line)
      .join('\n');
    expect(codigo).not.toContain('provideZonelessChangeDetection');
    expect(codigo).toContain('provideZoneChangeDetection()');
  });
});
