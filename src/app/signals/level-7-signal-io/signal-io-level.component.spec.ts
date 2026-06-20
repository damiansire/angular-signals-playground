import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalIoLevelComponent } from './signal-io-level.component';

describe('SignalIoLevelComponent', () => {
  let component: SignalIoLevelComponent;
  let fixture: ComponentFixture<SignalIoLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalIoLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalIoLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
