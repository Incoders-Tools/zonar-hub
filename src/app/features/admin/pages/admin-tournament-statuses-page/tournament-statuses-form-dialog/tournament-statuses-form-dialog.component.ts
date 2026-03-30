import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { TournamentStatus } from '../../../../../core/models';
import { TournamentStatusesFacadeService } from '../tournament-statuses-facade.service';

@Component({
  selector: 'app-tournament-statuses-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent
  ],
  templateUrl: './tournament-statuses-form-dialog.component.html',
  styleUrl: './tournament-statuses-form-dialog.component.scss'
})
export class TournamentStatusesFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TournamentStatusesFacadeService);

  readonly status = input<TournamentStatus | null>(null);
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
      description: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const status = this.status();
    if (status) {
      this.isEditing = true;
      this.form.patchValue({
        name: status.name,
        key: status.key,
        description: status.description || '',
        sortOrder: status.sortOrder || '',
        isActive: status.isActive
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

    const nameExists = await this.facade.checkNameExists(formValue.name, this.status()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.status()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.status(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveStatus(payload);
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
      return `admin.tournament-statuses.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.tournament-statuses.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.tournament-statuses.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.tournament-statuses.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.tournament-statuses.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.tournament-statuses.error.sortOrderExists';
    }

    return 'admin.tournament-statuses.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
