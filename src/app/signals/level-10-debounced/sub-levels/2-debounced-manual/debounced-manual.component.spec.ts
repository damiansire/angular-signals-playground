import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebouncedManualComponent } from './debounced-manual.component';

describe('DebouncedManualComponent', () => {
  let component: DebouncedManualComponent;
  let fixture: ComponentFixture<DebouncedManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedManualComponent],
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
});
