import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoColumnLayoutComponent } from './two-column-layout.component';

@Component({
  imports: [TwoColumnLayoutComponent],
  template: `
    <app-two-column-layout [title]="title">
      <span left>IZQUIERDA</span>
      <span right>DERECHA</span>
    </app-two-column-layout>
  `,
})
class HostComponent {
  title = 'No Title';
}

describe('TwoColumnLayoutComponent', () => {
  let component: TwoColumnLayoutComponent;
  let fixture: ComponentFixture<TwoColumnLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoColumnLayoutComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TwoColumnLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('passes the title input down to the title component', () => {
    fixture.componentRef.setInput('title', 'Mi sección');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mi sección');
  });

  it('uses the default title when none is provided', () => {
    expect(component.title()).toBe('No Title');
    expect(fixture.nativeElement.textContent).toContain('No Title');
  });

  it('projects left and right content into separate columns', () => {
    const wrapper = TestBed.createComponent(HostComponent);
    wrapper.detectChanges();
    const text = wrapper.nativeElement.textContent;
    expect(text).toContain('IZQUIERDA');
    expect(text).toContain('DERECHA');
  });
});
