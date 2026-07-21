import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expone el titulo de la aplicacion', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('angular-examples');
  });

  it('es una sola superficie: solo el router-outlet y el skip-link, sin sidebar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('router-outlet')).toBeTruthy();
    expect(el.querySelector('app-sidebar-menu')).toBeFalsy();

    const skip = el.querySelector('a.skip-link') as HTMLAnchorElement;
    expect(skip).toBeTruthy();
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(el.querySelector('#main-content')).toBeTruthy();
  });
});
