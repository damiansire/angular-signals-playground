import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DrawPreviewComponent } from './draw-preview.component';

describe('DrawPreviewComponent', () => {
  let component: DrawPreviewComponent;
  let fixture: ComponentFixture<DrawPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawPreviewComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('enlaza el input imgUrl al src del img', () => {
    fixture.componentRef.setInput('imgUrl', 'https://example.com/foo.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://example.com/foo.png');
  });

  it('el img tiene un texto alternativo descriptivo', () => {
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('Descripción de la imagen');
  });
});
