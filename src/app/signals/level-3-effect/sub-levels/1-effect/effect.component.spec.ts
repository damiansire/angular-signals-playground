import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EffectComponent } from './effect.component';

describe('EffectComponent', () => {
  let component: EffectComponent;
  let fixture: ComponentFixture<EffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EffectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EffectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
