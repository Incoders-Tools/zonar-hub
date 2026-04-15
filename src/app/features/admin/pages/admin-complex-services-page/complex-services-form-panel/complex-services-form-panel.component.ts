import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ComplexService } from '../../../../../core/models';
import { ComplexServicesFacadeService } from '../complex-services-facade.service';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';

@Component({
  selector: 'app-complex-services-form-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ActiveToggleComponent
  ],
  templateUrl: './complex-services-form-panel.component.html',
  styleUrl: './complex-services-form-panel.component.scss'
})
export class ComplexServicesFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ComplexServicesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly service = input<ComplexService | null>(null);
  readonly saving = input(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      faIcon: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const service = this.service();
    if (service) {
      this.isEditing = true;
      this.form.patchValue({
        name: service.name,
        key: service.key,
        faIcon: service.faIcon || '',
        sortOrder: service.sortOrder || '',
        isActive: service.isActive
      });
      // Disable key field when editing
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      const nextOrder = this.facade.getNextSortOrder();
      this.form.patchValue({
        sortOrder: nextOrder,
        isActive: true
      });
    }
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    // Get key value (need to handle disabled state)
    const keyValue = this.isEditing
      ? this.form.get('key')?.value
      : this.form.get('key')?.getRawValue();

    const formValue = this.form.getRawValue(); // Get disabled fields too

    // Validate uniqueness
    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(keyValue);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.service()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.service()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.service(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveService(payload);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.complex-services.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.complex-services.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.complex-services.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.complex-services.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.complex-services.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.complex-services.error.sortOrderExists';
    }

    return 'admin.complex-services.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
