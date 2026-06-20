import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RxjsInteropComponent } from './rxjs-interop.component';

describe('RxjsInteropComponent', () => {
  let component: RxjsInteropComponent;
  let fixture: ComponentFixture<RxjsInteropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RxjsInteropComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RxjsInteropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('untracked: cambiar multiplier no recalcula result hasta que cambia base', () => {
    expect(component.result()).toBe(20); // 10 * 2

    component.incMultiplier(); // multiplier = 3, pero no es dependencia
    expect(component.result()).toBe(20); // sigue memoizado

    component.incBase(); // base = 11 -> recalcula con multiplier actual (3)
    expect(component.result()).toBe(33);
  });
});
