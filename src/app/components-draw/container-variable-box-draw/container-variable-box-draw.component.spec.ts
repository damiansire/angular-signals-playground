import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ContainerVariableBoxDrawComponent } from './container-variable-box-draw.component';

describe('ContainerVariableBoxDrawComponent', () => {
  let component: ContainerVariableBoxDrawComponent;
  let fixture: ComponentFixture<ContainerVariableBoxDrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerVariableBoxDrawComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContainerVariableBoxDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('proyecta variableName al app-variable-box-draw hijo', () => {
    fixture.componentRef.setInput('variableName', 'counter');
    fixture.detectChanges();

    const inner = fixture.nativeElement.querySelector('app-variable-box-draw');
    expect(inner).toBeTruthy();
    expect((inner as HTMLElement).textContent?.trim()).toBe('counter');
  });

  it('envuelve al hijo en la outer-box', () => {
    const outer = fixture.nativeElement.querySelector('.outer-box');
    expect(outer).toBeTruthy();
    expect(outer.querySelector('app-variable-box-draw')).toBeTruthy();
  });
});
