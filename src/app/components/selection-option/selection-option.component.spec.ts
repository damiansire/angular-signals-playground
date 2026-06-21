import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionOptionComponent } from './selection-option.component';

describe('SelectionOptionComponent', () => {
  let component: SelectionOptionComponent;
  let fixture: ComponentFixture<SelectionOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionOptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza un boton por cada nivel y arranca con el nivel 1 seleccionado', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(4);
    expect(component.selectedLevel).toBe(1);
    expect((buttons[0] as HTMLElement).classList).toContain('bg-green-500');
    expect((buttons[1] as HTMLElement).classList).toContain('bg-gray-200');
  });

  it('selectLevel actualiza selectedLevel y emite selectedLevelChange', () => {
    let emitted: number | undefined;
    component.selectedLevelChange.subscribe((l) => (emitted = l));

    component.selectLevel(3);
    expect(component.selectedLevel).toBe(3);
    expect(emitted).toBe(3);
  });

  it('al hacer click en un boton resalta ese nivel en el template', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[2] as HTMLElement).click();
    fixture.detectChanges();

    expect(component.selectedLevel).toBe(3);
    expect((buttons[2] as HTMLElement).classList).toContain('bg-green-500');
    expect((buttons[0] as HTMLElement).classList).toContain('bg-gray-200');
  });
});
