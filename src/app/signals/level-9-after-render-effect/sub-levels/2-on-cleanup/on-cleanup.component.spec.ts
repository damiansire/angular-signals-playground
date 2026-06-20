import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnCleanupComponent } from './on-cleanup.component';

describe('OnCleanupComponent', () => {
  let component: OnCleanupComponent;
  let fixture: ComponentFixture<OnCleanupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnCleanupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OnCleanupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('apagar dispara el onCleanup (incrementa cleanups)', () => {
    component.toggle(); // enciende
    fixture.detectChanges();
    component.toggle(); // apaga -> onCleanup
    fixture.detectChanges();
    expect(component.cleanups()).toBeGreaterThanOrEqual(1);
  });
});
