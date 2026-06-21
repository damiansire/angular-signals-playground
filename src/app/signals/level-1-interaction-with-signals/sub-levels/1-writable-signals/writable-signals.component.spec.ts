import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { WritableSignalsComponent } from './writable-signals.component';

describe('WritableSignalsComponent', () => {
  let component: WritableSignalsComponent;
  let fixture: ComponentFixture<WritableSignalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritableSignalsComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WritableSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arranca el contador en 0 y lo muestra en pantalla', () => {
    expect(component.count()).toBe(0);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Amount: 0');
  });

  it('update incrementa el signal count', () => {
    component.update();
    component.update();
    expect(component.count()).toBe(2);
  });

  it('setValue toma el numero del input y lo asigna al signal', () => {
    component.myInput.nativeElement.value = '42';
    component.setValue();
    fixture.detectChanges();
    expect(component.count()).toBe(42);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Amount: 42');
  });

  it('setValue ignora valores no numericos', () => {
    component.count.set(7);
    component.myInput.nativeElement.value = 'abc';
    component.setValue();
    expect(component.count()).toBe(7);
  });
});
