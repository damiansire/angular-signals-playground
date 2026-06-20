import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonelessLevelComponent } from './zoneless-level.component';

describe('ZonelessLevelComponent', () => {
  let component: ZonelessLevelComponent;
  let fixture: ComponentFixture<ZonelessLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonelessLevelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonelessLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
