import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { WrapperAnimationComponent } from './wrapper-animation.component';

describe('WrapperAnimationComponent', () => {
  let component: WrapperAnimationComponent;
  let fixture: ComponentFixture<WrapperAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WrapperAnimationComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WrapperAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('es un componente presentacional sin contenido en el template (animacion via CSS)', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.children.length).toBe(0);
    expect(host.textContent?.trim()).toBe('');
  });
});
