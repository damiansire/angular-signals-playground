import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

import { ContentQueriesComponent } from './content-queries.component';
import { TagListComponent } from './tag-list/tag-list.component';

/**
 * La lección de este sub-nivel es que `contentChildren()` es un signal: el hijo se entera solo
 * cuando el padre proyecta más o menos contenido. El spec anterior asserteaba `names()`, que es un
 * signal plano del padre, así que pasaba en verde aunque la query nunca se hubiera actualizado (o
 * aunque el hijo ni existiera). Acá se afirma sobre el hijo, que es quien hace la query.
 */
describe('ContentQueriesComponent', () => {
  let fixture: ComponentFixture<ContentQueriesComponent>;
  let component: ContentQueriesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentQueriesComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** El hijo que hace la query sobre el contenido que le proyectan. */
  function tagList(): TagListComponent {
    return fixture.debugElement.query(By.directive(TagListComponent)).componentInstance;
  }

  it('el hijo cuenta lo que el padre le proyecta', () => {
    expect(tagList().count()).toBe(component.names().length);
    expect(tagList().count()).toBe(3);
  });

  it('la query se actualiza sola al proyectar un tag más', () => {
    component.add();
    fixture.detectChanges();

    expect(component.names().length).toBe(4);
    expect(tagList().count()).toBe(4);
  });

  it('la query se actualiza sola al sacar un tag', () => {
    component.removeLast();
    fixture.detectChanges();

    expect(component.names().length).toBe(2);
    expect(tagList().count()).toBe(2);
  });

  it('contentChild() sigue al PRIMER proyectado, no a cualquiera', () => {
    expect(tagList().firstText()).toBe('Ada');

    component.removeLast();
    fixture.detectChanges();
    // Sacar el último no cambia el primero: la query apunta al primero, no al último visto.
    expect(tagList().firstText()).toBe('Ada');
  });

  it('el conteo que se ve en pantalla es el de la query, no el del padre', () => {
    component.add();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Proyectados:');
    expect(texto).toContain('4');
  });
});
