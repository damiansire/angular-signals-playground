import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppButton } from './button.directive';
import { provideAppButtonOptions } from './button.options';

@Component({
  imports: [AppButton],
  template: `<button appButton [size]="size()" [appearance]="appearance()">Guardar</button>`,
})
class HostComponent {
  readonly size = signal<'s' | 'm' | 'l'>('m');
  readonly appearance = signal<'primary' | 'secondary'>('primary');
}

describe('AppButton directive', () => {
  function setup(providers: unknown[] = []): {
    fixture: ComponentFixture<HostComponent>;
    button: HTMLButtonElement;
  } {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection(), ...(providers as never[])],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, button: fixture.nativeElement.querySelector('button') };
  }

  it('keeps the projected content inside the native button', () => {
    const { button } = setup();
    expect(button.textContent?.trim()).toBe('Guardar');
  });

  it('applies size and appearance as data attributes from the defaults', () => {
    const { button } = setup();
    expect(button.getAttribute('data-size')).toBe('m');
    expect(button.getAttribute('data-appearance')).toBe('primary');
  });

  it('reflects input changes on the host classes', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.appearance.set('secondary');
    fixture.detectChanges();
    expect(button.getAttribute('data-appearance')).toBe('secondary');
    expect(button.className).toContain('border-black');
  });

  it('takes its default from the options token via DI', () => {
    @Component({
      imports: [AppButton],
      template: `<button appButton>X</button>`,
    })
    class DefaultHost {}

    TestBed.configureTestingModule({
      imports: [DefaultHost],
      providers: [
        provideZonelessChangeDetection(),
        provideAppButtonOptions({ appearance: 'secondary', size: 'l' }),
      ],
    });
    const fixture = TestBed.createComponent(DefaultHost);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('data-appearance')).toBe('secondary');
    expect(button.getAttribute('data-size')).toBe('l');
  });
});
