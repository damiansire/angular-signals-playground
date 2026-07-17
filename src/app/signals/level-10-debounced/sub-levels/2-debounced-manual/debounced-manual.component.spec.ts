import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DebouncedManualComponent } from './debounced-manual.component';

describe('DebouncedManualComponent', () => {
  let component: DebouncedManualComponent;
  let fixture: ComponentFixture<DebouncedManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedManualComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el valor inmediato cambia al instante', () => {
    component.setQuery('abc');
    expect(component.query()).toBe('abc');
  });

  it('debounced() no cambia hasta que pasan los 400ms', () => {
    jasmine.clock().install();
    try {
      component.setQuery('a');
      fixture.detectChanges(); // corre el effect -> programa el setTimeout(400)
      jasmine.clock().tick(399);
      expect(component.debounced()).toBe('');
      jasmine.clock().tick(1);
      expect(component.debounced()).toBe('a');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('cada tecla cancela el timer anterior: solo pega el último valor', () => {
    jasmine.clock().install();
    try {
      component.setQuery('a');
      fixture.detectChanges();
      jasmine.clock().tick(200);
      component.setQuery('ab');
      fixture.detectChanges(); // onCleanup limpia el timer de 'a' y programa el de 'ab'
      jasmine.clock().tick(200);
      // 'a' fue cancelado y 'ab' todavía no cumplió sus 400ms: sigue vacío.
      expect(component.debounced()).toBe('');
      jasmine.clock().tick(200);
      expect(component.debounced()).toBe('ab');
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
