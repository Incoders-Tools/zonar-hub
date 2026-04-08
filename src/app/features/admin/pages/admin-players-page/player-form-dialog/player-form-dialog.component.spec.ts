import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PlayerFormDialogComponent } from './player-form-dialog.component';
import { PlayerFacadeService } from '../player-facade.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { signal } from '@angular/core';

describe('PlayerFormDialogComponent', () => {
  let component: PlayerFormDialogComponent;
  let fixture: ComponentFixture<PlayerFormDialogComponent>;
  let facadeSpy: jasmine.SpyObj<PlayerFacadeService>;

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('PlayerFacadeService', [
      'save'
    ], {
      players: signal([]),
      saving: signal(false),
      categories: signal([]),
      genders: signal([]),
      sports: signal([])
    });

    await TestBed.configureTestingModule({
      imports: [PlayerFormDialogComponent, ReactiveFormsModule],
      providers: [
        I18nService,
        { provide: PlayerFacadeService, useValue: facadeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with defaults for create mode', () => {
    expect(component.isEditing).toBe(false);
    expect(component.form.get('firstName')?.value).toBe('');
    expect(component.form.get('lastName')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('isActive')?.value).toBe(true);
  });

  it('should have invalid form when firstName is empty', () => {
    component.form.get('firstName')?.setValue('');
    component.form.get('firstName')?.markAsTouched();
    expect(component.form.get('firstName')?.invalid).toBe(true);
  });

  it('should have invalid form when email is invalid', () => {
    component.form.get('email')?.setValue('not-an-email');
    component.form.get('email')?.markAsTouched();
    expect(component.form.get('email')?.hasError('email')).toBe(true);
  });

  it('should have invalid form when genderId is empty', () => {
    component.form.get('genderId')?.setValue('');
    component.form.get('genderId')?.markAsTouched();
    expect(component.form.get('genderId')?.invalid).toBe(true);
  });

  it('should have invalid form when categoryId is empty', () => {
    component.form.get('categoryId')?.setValue('');
    component.form.get('categoryId')?.markAsTouched();
    expect(component.form.get('categoryId')?.invalid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    component.form.get('firstName')?.setValue('');
    expect(component.canSubmit).toBe(false);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate ranking minimum', () => {
    component.form.get('ranking')?.setValue(0);
    component.form.get('ranking')?.markAsTouched();
    expect(component.form.get('ranking')?.hasError('min')).toBe(true);
  });
});
