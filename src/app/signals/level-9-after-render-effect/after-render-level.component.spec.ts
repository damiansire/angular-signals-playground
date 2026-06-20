import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfterRenderLevelComponent } from './after-render-level.component';

describe('AfterRenderLevelComponent', () => {
  let component: AfterRenderLevelComponent;
  let fixture: ComponentFixture<AfterRenderLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfterRenderLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AfterRenderLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
