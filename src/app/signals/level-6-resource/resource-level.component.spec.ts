import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ResourceLevelComponent } from './resource-level.component';

describe('ResourceLevelComponent', () => {
  let component: ResourceLevelComponent;
  let fixture: ComponentFixture<ResourceLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLevelComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del nivel resource via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('resource() — signals asincrónicos!');
  });

  it('menciona resource() y lista los dos sub-niveles', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('resource()');
    const items = fixture.nativeElement.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });
});
