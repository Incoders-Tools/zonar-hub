import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { Sport } from '../../../../../core/models';
import { SportsFacadeService } from '../sports-facade.service';

@Component({
  selector: 'app-sports-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent
  ],
  templateUrl: './sports-form-dialog.component.html',
  styleUrl: './sports-form-dialog.component.scss'
})
export class SportsFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(SportsFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly sport = input<Sport | null>(null);
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
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      icon: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });

    // Auto-generate key from name
    this.form.get('name')?.valueChanges.subscribe(name => {
      if (!this.isEditing && name) {
        const generatedKey = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        this.form.get('key')?.setValue(generatedKey, { emitEvent: false });
      }
    });
  }

  private populateForm(): void {
    const sport = this.sport();
    if (sport) {
      this.isEditing = true;
      this.form.patchValue({
        name: sport.name,
        key: sport.key,
        icon: sport.icon || '',
        sortOrder: sport.sortOrder || '',
        isActive: sport.isActive
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

    const formValue = this.form.getRawValue(); // Get disabled fields too

    // Validate uniqueness
    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.sport()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.sport()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.sport(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveSport(payload);
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
      return `admin.sports.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.sports.error.${controlName}Pattern`;
    }
    if (control.errors['min']) {
      return 'admin.sports.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.sports.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.sports.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.sports.error.sortOrderExists';
    }

    return 'admin.sports.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
