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
    component.onInput('Ada');
    expect(component.typed()).toBe('Ada');
  });
});
