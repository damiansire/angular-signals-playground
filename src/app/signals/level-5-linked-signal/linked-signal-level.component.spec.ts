import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkedSignalLevelComponent } from './linked-signal-level.component';

describe('LinkedSignalLevelComponent', () => {
  let component: LinkedSignalLevelComponent;
  let fixture: ComponentFixture<LinkedSignalLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkedSignalLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkedSignalLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
