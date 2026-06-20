import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceEqualityComponent } from './reference-equality.component';

describe('ReferenceEqualityComponent', () => {
  let component: ReferenceEqualityComponent;
  let fixture: ComponentFixture<ReferenceEqualityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferenceEqualityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReferenceEqualityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('un objeto nuevo con el mismo contenido notifica (Object.is por referencia)', () => {
    expect(component.notifications()).toBe(0);
    component.setSameContent();
    fixture.detectChanges();
    expect(component.notifications()).toBe(1);
  });

  it('la misma referencia no genera una nueva notificacion', () => {
    component.setSameContent();
    fixture.detectChanges();
    const before = component.notifications();
    component.setSameReference();
    fixture.detectChanges();
    expect(component.notifications()).toBe(before);
  });
});
