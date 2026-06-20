import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalEqualityLevelComponent } from './signal-equality-level.component';

describe('SignalEqualityLevelComponent', () => {
  let component: SignalEqualityLevelComponent;
  let fixture: ComponentFixture<SignalEqualityLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalEqualityLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalEqualityLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
