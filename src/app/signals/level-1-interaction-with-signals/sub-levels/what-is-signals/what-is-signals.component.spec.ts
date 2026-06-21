import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatIsSignalsComponent } from './what-is-signals.component';

describe('WhatIsSignalsComponent', () => {
  let component: WhatIsSignalsComponent;
  let fixture: ComponentFixture<WhatIsSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIsSignalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatIsSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo del componente via app-title', () => {
    const title = fixture.nativeElement.querySelector('app-title h1') as HTMLElement;
    expect(title.textContent?.trim()).toBe('¿Qué es un signal?!');
  });

  it('convertToContainer marca el tipo como contenedor e incrementa clickCount', () => {
    expect(component.clickCount).toBe(0);
    component.convertToContainer({ name: 'Number', value: '' });

    const numberType = component.dataTypes.find((t) => t.text === 'Number')!;
    expect(numberType.isContainer).toBeTrue();
    expect(component.clickCount).toBe(1);
  });

  it('convertToContainer ignora un tipo inexistente', () => {
    component.convertToContainer({ name: 'NoExiste', value: '' });
    expect(component.clickCount).toBe(0);
  });

  it('al clickear una cajita se la convierte en app-container-variable-box-draw', () => {
    expect(fixture.nativeElement.querySelectorAll('app-container-variable-box-draw').length).toBe(0);

    const firstBox = fixture.nativeElement.querySelector(
      'app-variable-box-draw [role="button"]'
    ) as HTMLElement;
    firstBox.click();
    fixture.detectChanges();

    const containers = fixture.nativeElement.querySelectorAll('app-container-variable-box-draw');
    expect(containers.length).toBe(1);
  });

  it('no muestra el code-legacy del wrapper hasta el primer click', () => {
    expect(fixture.nativeElement.querySelector('app-code-legacy')).toBeNull();

    const firstBox = fixture.nativeElement.querySelector(
      'app-variable-box-draw [role="button"]'
    ) as HTMLElement;
    firstBox.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-code-legacy')).toBeTruthy();
  });
});
