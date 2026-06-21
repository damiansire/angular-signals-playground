import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ClickHistoryComponent } from './click-history.component';
import { ClickInButton } from '../component.interface';

describe('ClickHistoryComponent', () => {
  let component: ClickHistoryComponent;
  let fixture: ComponentFixture<ClickHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClickHistoryComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClickHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el titulo Clicks y sin eventos cuando el historial esta vacio', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Clicks');
    expect(fixture.nativeElement.querySelectorAll('app-event').length).toBe(0);
  });

  it('renderiza un app-event por cada click del historial', () => {
    const history: ClickInButton[] = [
      { date: new Date(), firstName: 'Ana', surname: 'Gomez' },
      { date: new Date(), firstName: 'Luis', surname: 'Diaz' },
    ];
    fixture.componentRef.setInput('clickHistory', history);
    fixture.detectChanges();

    const events = fixture.nativeElement.querySelectorAll('app-event');
    expect(events.length).toBe(2);
  });
});
