import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { MenuSeparatorComponent } from './menu-separator.component';

describe('MenuSeparatorComponent', () => {
  let component: MenuSeparatorComponent;
  let fixture: ComponentFixture<MenuSeparatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSeparatorComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuSeparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza un li con la barra separadora centrada', () => {
    const li = fixture.nativeElement.querySelector('li') as HTMLElement;
    expect(li).toBeTruthy();
    expect(li.classList).toContain('justify-center');
    const bar = li.querySelector('div') as HTMLElement;
    expect(bar.classList).toContain('bg-sky-200');
  });
});
