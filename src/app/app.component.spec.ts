import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'interior', children: [] }]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('expone el titulo de la aplicacion', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('angular-examples');
  });

  it('en la vista integrada (/) es full-bleed: oculta el sidebar del banco', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // La vista integrada entra por defecto (url === '/') → sin chrome, solo contenido.
    expect(el.querySelector('app-sidebar-menu')).toBeFalsy();
    expect(el.querySelector('router-outlet')).toBeTruthy();

    const skip = el.querySelector('a.skip-link') as HTMLAnchorElement;
    expect(skip).toBeTruthy();
    expect(skip.getAttribute('href')).toBe('#main-content');
    expect(el.querySelector('#main-content')).toBeTruthy();
  });

  it('fuera de la vista integrada muestra el chrome del banco (sidebar)', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await router.navigate(['/interior']);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-sidebar-menu')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
