import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebouncedRxjsComponent } from './debounced-rxjs.component';

describe('DebouncedRxjsComponent', () => {
  let component: DebouncedRxjsComponent;
  let fixture: ComponentFixture<DebouncedRxjsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedRxjsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedRxjsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el valor inmediato cambia al instante', () => {
    component.setQuery('ho');
    expect(component.query()).toBe('ho');
  });
});
