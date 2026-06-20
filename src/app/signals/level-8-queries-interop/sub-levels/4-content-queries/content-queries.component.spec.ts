import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentQueriesComponent } from './content-queries.component';

describe('ContentQueriesComponent', () => {
  let component: ContentQueriesComponent;
  let fixture: ComponentFixture<ContentQueriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentQueriesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('agrega y quita tags proyectados', () => {
    expect(component.names().length).toBe(3);
    component.add();
    expect(component.names().length).toBe(4);
    component.removeLast();
    expect(component.names().length).toBe(3);
  });
});
