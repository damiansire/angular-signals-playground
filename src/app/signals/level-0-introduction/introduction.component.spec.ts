import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { IntroductionComponent } from './introduction.component';

describe('IntroductionComponent', () => {
  let component: IntroductionComponent;
  let fixture: ComponentFixture<IntroductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroductionComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(IntroductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo de la introduccion via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Introducción: ¿por qué signals?!');
  });

  it('habla de deteccion de cambios y lista los cuatro sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('detecta cambios');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(4);
  });
});
