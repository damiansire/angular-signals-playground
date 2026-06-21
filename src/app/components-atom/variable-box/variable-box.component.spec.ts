import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariableBoxComponent } from './variable-box.component';

describe('VariableBoxComponent', () => {
  let component: VariableBoxComponent;
  let fixture: ComponentFixture<VariableBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariableBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VariableBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('refleja variableName y variableValue en los spans', () => {
    fixture.componentRef.setInput('variableName', 'counter');
    fixture.componentRef.setInput('variableValue', '42');
    fixture.detectChanges();

    const spans = fixture.nativeElement.querySelectorAll('span');
    expect(spans[0].textContent?.trim()).toBe('counter');
    expect(spans[1].textContent?.trim()).toBe('42');
  });

  it('emite clickEvent al hacer click en la caja', () => {
    let emitted = 0;
    component.clickEvent.subscribe(() => emitted++);

    const box = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    box.click();

    expect(emitted).toBe(1);
  });

  it('emite clickEvent con keyup.enter', () => {
    let emitted = 0;
    component.clickEvent.subscribe(() => emitted++);

    const box = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    box.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

    expect(emitted).toBe(1);
  });
});
