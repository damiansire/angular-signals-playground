import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ViewChildComponent } from './view-child.component';

describe('ViewChildComponent', () => {
  let component: ViewChildComponent;
  let fixture: ComponentFixture<ViewChildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewChildComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewChildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('resuelve la query del elemento tras inicializar la vista', () => {
    expect(component.resolved()).toBe(true);
    expect(component.nameField()?.nativeElement.tagName).toBe('INPUT');
  });

  it('refleja el texto leído del campo', () => {
    const input = component.nameField()!.nativeElement;
    input.value = 'Ada';
    input.dispatchEvent(new Event('input'));
    expect(component.typed()).toBe('Ada');
  });

  it('Limpiar vacía el campo y el texto leído', () => {
    const input = component.nameField()!.nativeElement;
    input.value = 'Ada';
    input.dispatchEvent(new Event('input'));
    // FormField writes to the DOM only when the bound value differs from the last render.
    fixture.detectChanges();

    component.clearField();
    fixture.detectChanges();

    expect(component.typed()).toBe('');
    expect(input.value).toBe('');
  });
});
