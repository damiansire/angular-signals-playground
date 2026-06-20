import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebouncedLevelComponent } from './debounced-level.component';

describe('DebouncedLevelComponent', () => {
  let component: DebouncedLevelComponent;
  let fixture: ComponentFixture<DebouncedLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebouncedLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DebouncedLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
