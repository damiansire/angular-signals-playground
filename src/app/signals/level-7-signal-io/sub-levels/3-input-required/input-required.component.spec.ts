import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputRequiredComponent } from './input-required.component';

describe('InputRequiredComponent', () => {
  let component: InputRequiredComponent;
  let fixture: ComponentFixture<InputRequiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputRequiredComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputRequiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('controla el count y el highlight que recibe el badge', () => {
    expect(component.count()).toBe(3);
    component.more();
    expect(component.count()).toBe(4);
    expect(component.highlight()).toBe(false);
    component.toggle();
    expect(component.highlight()).toBe(true);
  });
});
