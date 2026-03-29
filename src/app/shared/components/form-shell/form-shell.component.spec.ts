import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormShellComponent } from './form-shell.component';

describe('FormShellComponent', () => {
  let fixture: ComponentFixture<FormShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormShellComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
