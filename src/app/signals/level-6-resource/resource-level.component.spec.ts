import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceLevelComponent } from './resource-level.component';

describe('ResourceLevelComponent', () => {
  let component: ResourceLevelComponent;
  let fixture: ComponentFixture<ResourceLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
