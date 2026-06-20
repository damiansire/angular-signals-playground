import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RxResourceComponent } from './rx-resource.component';

describe('RxResourceComponent', () => {
  let component: RxResourceComponent;
  let fixture: ComponentFixture<RxResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RxResourceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RxResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el id de la petición al elegir un usuario', () => {
    component.setUser(2);
    expect(component.userId()).toBe(2);
  });
});
