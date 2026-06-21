import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CodeAndTabsComponent } from './code-and-tabs.component';

describe('CodeAndTabsComponent', () => {
  let component: CodeAndTabsComponent;
  let fixture: ComponentFixture<CodeAndTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeAndTabsComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeAndTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza el parrafo placeholder del componente', () => {
    const p = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(p).toBeTruthy();
    expect(p.textContent?.trim()).toBe('code-and-tabs works!');
  });
});
