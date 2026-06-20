import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEqualComponent } from './custom-equal.component';

describe('CustomEqualComponent', () => {
  let component: CustomEqualComponent;
  let fixture: ComponentFixture<CustomEqualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomEqualComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomEqualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('con equal custom, mismo name no notifica aunque sea otro objeto', () => {
    expect(component.notifications()).toBe(0);
    component.setSameName();
    fixture.detectChanges();
    expect(component.notifications()).toBe(0);
  });

  it('cambiar el name sí notifica', () => {
    component.setOtherName();
    fixture.detectChanges();
    expect(component.notifications()).toBe(1);
  });
});
