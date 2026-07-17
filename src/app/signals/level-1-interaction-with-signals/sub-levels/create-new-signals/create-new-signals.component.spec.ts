import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CreateNewSignalsComponent } from './create-new-signals.component';

describe('CreateNewSignalsComponent', () => {
  let component: CreateNewSignalsComponent;
  let fixture: ComponentFixture<CreateNewSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewSignalsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo sobre leer un signal', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Leer un signal: el getter ()!');
  });

  it('lines resalta la declaracion del signal', () => {
    const active = component.lines().filter((l) => l.active);
    expect(active.length).toBe(1);
    expect(active[0].line).toBe('count = signal(0);');
  });

  it('htmlLines resalta la lectura del getter count()', () => {
    const active = component.htmlLines().filter((l) => l.active);
    expect(active.length).toBe(1);
    expect((active[0].line as string).trim()).toBe('count()');
  });

  it('renderiza dos bloques de codigo (html + ts)', () => {
    const codeBlocks = fixture.nativeElement.querySelectorAll('app-code');
    expect(codeBlocks.length).toBe(2);
  });
});
