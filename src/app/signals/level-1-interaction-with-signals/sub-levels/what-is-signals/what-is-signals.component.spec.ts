import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { WhatIsSignalsComponent } from './what-is-signals.component';

describe('WhatIsSignalsComponent', () => {
  let component: WhatIsSignalsComponent;
  let fixture: ComponentFixture<WhatIsSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIsSignalsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatIsSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const nodo = (id: string) =>
    fixture.nativeElement.querySelector(`[data-nodo="${id}"]`) as HTMLElement;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del componente via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    // Sin "!" pegado: el título ya cierra con signo de pregunta (ver TitleComponent.displayTitle).
    expect(title.textContent?.trim()).toBe('¿Qué es un signal?');
  });

  it('convertToContainer marca el tipo como contenedor e incrementa clickCount', () => {
    expect(component.clickCount()).toBe(0);
    component.convertToContainer({ name: 'Number', value: '' });

    const numberType = component.dataTypes().find((t) => t.text === 'Number')!;
    expect(numberType.isContainer).toBeTrue();
    expect(component.clickCount()).toBe(1);
  });

  it('convertToContainer ignora un tipo inexistente', () => {
    component.convertToContainer({ name: 'NoExiste', value: '' });
    expect(component.clickCount()).toBe(0);
  });

  it('al clickear una cajita se la convierte en un signal enchufado al consumidor', () => {
    expect(fixture.nativeElement.querySelectorAll('.ci__nodo--fuente').length).toBe(0);
    expect(component.enlaces().filter((e) => e.vivo).length).toBe(0);

    nodo('Number').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.ci__nodo--fuente').length).toBe(1);
    expect(component.enlaces().filter((e) => e.vivo)).toEqual([
      { de: 'Number', a: 'pantalla', vivo: true },
    ]);
  });

  it('solo le llega al consumidor lo que está envuelto, y sin envolver el clic no le avisa', () => {
    const consumidor = () => component.nodos().find((n) => n.id === 'pantalla')?.valor;
    const antes = consumidor();

    nodo('Number').click();
    fixture.detectChanges();
    expect(consumidor()).toBe(antes);

    nodo('Number').click();
    fixture.detectChanges();
    expect(consumidor()).toBe('6');
  });

  it('no muestra el bloque de código del wrapper hasta el primer click', () => {
    expect(fixture.nativeElement.querySelector('app-code')).toBeNull();

    nodo('Number').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-code')).toBeTruthy();
  });
});
