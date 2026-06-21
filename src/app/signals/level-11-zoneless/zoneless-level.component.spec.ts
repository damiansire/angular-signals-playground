import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ZonelessLevelComponent } from './zoneless-level.component';

describe('ZonelessLevelComponent', () => {
  let component: ZonelessLevelComponent;
  let fixture: ComponentFixture<ZonelessLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonelessLevelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonelessLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo capstone zoneless via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Capstone: hacia zoneless!');
  });

  it('menciona Zone.js / provideZonelessChangeDetection y lista un sub-nivel', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Zone.js');
    expect(text).toContain('provideZonelessChangeDetection()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(1);
  });
});
