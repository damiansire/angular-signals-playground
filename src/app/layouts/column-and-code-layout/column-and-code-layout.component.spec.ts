import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnAndCodeLayoutComponent } from './column-and-code-layout.component';
import { CodeLine } from '../../components-atom/component-atom.interface';

@Component({
  imports: [ColumnAndCodeLayoutComponent],
  template: `
    <app-column-and-code-layout [title]="title" [concept]="concept" [codeLines]="codeLines">
      <p class="proyectado">contenido proyectado</p>
    </app-column-and-code-layout>
  `,
})
class HostComponent {
  title = 'Mi Layout';
  concept = '';
  codeLines: CodeLine[] = [];
}

describe('ColumnAndCodeLayoutComponent', () => {
  let component: ColumnAndCodeLayoutComponent;
  let fixture: ComponentFixture<ColumnAndCodeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnAndCodeLayoutComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnAndCodeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refleja el input title en el app-title hijo', () => {
    fixture.componentRef.setInput('title', 'Layout de prueba');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Layout de prueba!');
  });

  it('no muestra la tarjeta de concepto cuando concept esta vacio', () => {
    expect(fixture.nativeElement.querySelector('app-concept-card')).toBeNull();
  });

  it('muestra la tarjeta de concepto cuando se pasa concept', () => {
    fixture.componentRef.setInput('concept', 'Un concepto didactico');
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('app-concept-card');
    expect(card).toBeTruthy();
    expect((card as HTMLElement).textContent).toContain('Un concepto didactico');
  });

  describe('con host de proyeccion', () => {
    let hostFixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
    });

    it('proyecta el contenido del ng-content y renderiza el bloque de código', () => {
      const projected = hostFixture.nativeElement.querySelector('.proyectado') as HTMLElement;
      expect(projected).toBeTruthy();
      expect(projected.textContent?.trim()).toBe('contenido proyectado');
      expect(hostFixture.nativeElement.querySelector('app-code')).toBeTruthy();
    });
  });
});
