import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { Role, isSystemRole } from '../../../../../core/models';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AsyncButtonComponent,
    FormShellComponent
  ],
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.scss'
})
export class RolesFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly role = input<Role | null>(null);
  readonly isSubmitting = input(false);

  // Outputs
  readonly submitted = output<Partial<Role>>();
  readonly cancelled = output<void>();

  // Internal State
  readonly form = signal<FormGroup | null>(null);
  readonly isSystemRole = signal(false);
  readonly formTouched = signal(false);

  // Computed values
  readonly isEditMode = computed(() => this.role() !== null);

  readonly formTitle = computed(() =>
    this.isEditMode() ? 'admin.roles.form.edit' : 'admin.roles.form.create'
  );

  readonly isFormValid = computed(() => {
    const group = this.form();
    return group ? group.valid : false;
  });

  readonly submitButtonDisabled = computed(() =>
    this.isSubmitting() || !this.isFormValid() || !this.formTouched()
  );

  readonly nameField = computed(() => this.form()?.get('name'));
  readonly descriptionField = computed(() => this.form()?.get('description'));
  readonly isActiveField = computed(() => this.form()?.get('isActive'));

  readonly nameError = computed(() => this.getErrorMessage('name'));
  readonly descriptionError = computed(() => this.getErrorMessage('description'));

  readonly nameFieldTouched = computed(() => this.nameField()?.touched ?? false);
  readonly descriptionFieldTouched = computed(() => this.descriptionField()?.touched ?? false);

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initializes form with values from input role (if in edit mode)
   * Disables name field for system roles
   */
  private initializeForm(): void {
    const existingRole = this.role();
    const isSystem = existingRole ? isSystemRole(existingRole.name) : false;

    this.isSystemRole.set(isSystem);

    const group = this.fb.group({
      name: [
        {
          value: existingRole?.name || '',
          disabled: isSystem
        },
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-z0-9_]+$/)
        ]
      ],
      description: [
        existingRole?.description || '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500)
        ]
      ],
      isActive: [existingRole?.isActive ?? true]
    });

    // Watch for form changes to track touched state
    group.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.formTouched() && group.dirty) {
          this.formTouched.set(true);
        }
      });

    this.form.set(group);
  }

  /**
   * Submits the form if valid
   */
  onSubmit(): void {
    const group = this.form();
    if (!group || group.invalid) {
      this.formTouched.set(true);
      return;
    }

    const formValue = group.getRawValue();
    this.submitted.emit({
      name: formValue.name,
      description: formValue.description,
      isActive: formValue.isActive
    });
  }

  /**
   * Cancels the form
   */
  onCancel(): void {
    this.cancelled.emit();
  }

  /**
   * Returns i18n error message key for a field
   */
  getErrorMessage(fieldName: string): string {
    const group = this.form();
    if (!group) return '';

    const control = group.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return `admin.roles.error.${fieldName}.required`;
    }
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `admin.roles.error.${fieldName}.minlength`;
    }
    if (control.errors['maxlength']) {
      return `admin.roles.error.${fieldName}.maxlength`;
    }
    if (control.errors['pattern']) {
      return `admin.roles.error.${fieldName}.pattern`;
    }

    return '';
  }

  /**
   * Checks if field has error to display
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.form()?.get(fieldName);
    return (control?.invalid && control?.touched) ?? false;
  }

  /**
   * Gets current field value for display
   */
  getFieldValue(fieldName: string): string {
    const control = this.form()?.get(fieldName);
    return control?.value ?? '';
  }

  /**
   * Marks all fields as touched to show validation errors
   */
  markAllAsTouched(): void {
    const group = this.form();
    if (group) {
      Object.keys(group.controls).forEach(key => {
        group.get(key)?.markAsTouched();
      });
    }
  }
}
