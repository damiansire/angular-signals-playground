import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeLegacyComponent } from './code-legacy.component';

describe('CodeLegacyComponent', () => {
  let component: CodeLegacyComponent;
  let fixture: ComponentFixture<CodeLegacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeLegacyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeLegacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
