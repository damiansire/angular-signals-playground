import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, provideZonelessChangeDetection } from '@angular/core';

import { DependenciesStatusComponent } from './dependencies-status.component';

describe('DependenciesStatusComponent', () => {
  let component: DependenciesStatusComponent;
  let fixture: ComponentFixture<DependenciesStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DependenciesStatusComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DependenciesStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refleja computedName en el badge superior', () => {
    fixture.componentRef.setInput('computedName', 'fullName');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('fullName');
  });

  it('oculta la seccion Signals Inside cuando no hay signals', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Signals Inside');
  });

  it('muestra Signals Inside y sus chips cuando hay signals', () => {
    fixture.componentRef.setInput('signalsInside', signal(['a', 'b']));
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Signals Inside');
    expect(text).toContain('a');
    expect(text).toContain('b');
  });

  it('renderiza un chip por cada dependency', () => {
    fixture.componentRef.setInput('dependencies', signal(['x', 'y', 'z']));
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.bg-gray-700');
    expect(chips.length).toBe(3);
  });
});
