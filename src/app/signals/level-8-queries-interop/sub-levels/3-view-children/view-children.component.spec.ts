import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { ViewChildrenComponent } from './view-children.component';

describe('ViewChildrenComponent', () => {
  let component: ViewChildrenComponent;
  let fixture: ComponentFixture<ViewChildrenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewChildrenComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewChildrenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('la query plural refleja la cantidad de elementos', () => {
    expect(component.chipCount()).toBe(3);
    component.add();
    fixture.detectChanges();
    expect(component.chipCount()).toBe(4);
  });
});
