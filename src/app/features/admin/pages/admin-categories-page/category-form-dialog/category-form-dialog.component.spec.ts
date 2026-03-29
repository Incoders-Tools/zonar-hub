import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryFormDialogComponent } from './category-form-dialog.component';
import { CategoryFacadeService } from '../category-facade.service';
import { EntityKeyService } from '../../../../../shared/services/entity-key.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { signal } from '@angular/core';

describe('CategoryFormDialogComponent', () => {
  let component: CategoryFormDialogComponent;
  let fixture: ComponentFixture<CategoryFormDialogComponent>;
  let facadeSpy: jasmine.SpyObj<CategoryFacadeService>;

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('CategoryFacadeService', [
      'save', 'getExistingKeys'
    ], {
      categories: signal([]),
      saving: signal(false)
    });
    facadeSpy.getExistingKeys.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [CategoryFormDialogComponent, ReactiveFormsModule],
      providers: [
        EntityKeyService,
        I18nService,
        { provide: CategoryFacadeService, useValue: facadeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with defaults for create mode', () => {
    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('level')?.value).toBe(1);
    expect(component.form.get('isActive')?.value).toBe(true);
  });

  it('should have invalid form when name is empty', () => {
    component.form.get('name')?.setValue('');
    component.form.get('name')?.markAsTouched();
    expect(component.form.get('name')?.invalid).toBe(true);
  });

  it('should have invalid form when level is less than 1', () => {
    component.form.get('level')?.setValue(0);
    component.form.get('level')?.markAsTouched();
    expect(component.form.get('level')?.invalid).toBe(true);
  });

  it('should auto-generate key from name', () => {
    component.form.get('name')?.setValue('Promocional Especial');
    expect(component.form.get('key')?.value).toBe('promocional_especial');
  });

  it('should normalize name on blur', () => {
    component.form.get('name')?.setValue('CUARTA');
    component.onNameBlur();
    expect(component.form.get('name')?.value).toBe('Cuarta');
  });

  it('should not submit when form is invalid', () => {
    component.form.get('name')?.setValue('');
    expect(component.canSubmit).toBe(false);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
