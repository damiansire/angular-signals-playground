import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ResourceBasicComponent } from './resource-basic.component';

describe('ResourceBasicComponent', () => {
  let component: ResourceBasicComponent;
  let fixture: ComponentFixture<ResourceBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceBasicComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('actualiza el id de la petición al elegir un usuario', () => {
    expect(component.userId()).toBe(1);
    component.setUser(3);
    expect(component.userId()).toBe(3);
  });
});
