import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueriesInteropLevelComponent } from './queries-interop-level.component';

describe('QueriesInteropLevelComponent', () => {
  let component: QueriesInteropLevelComponent;
  let fixture: ComponentFixture<QueriesInteropLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueriesInteropLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QueriesInteropLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
