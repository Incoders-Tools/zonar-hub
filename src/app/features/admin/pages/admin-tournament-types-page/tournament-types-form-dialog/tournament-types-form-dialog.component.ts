import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { TournamentType } from '../../../../../core/models';
import { TournamentTypesFacadeService } from '../tournament-types-facade.service';

@Component({
  selector: 'app-tournament-types-form-dialog',
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
  templateUrl: './tournament-types-form-dialog.component.html',
  styleUrl: './tournament-types-form-dialog.component.scss'
})
export class TournamentTypesFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TournamentTypesFacadeService);

  readonly type = input<TournamentType | null>(null);
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
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s]+$/)]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      sortOrder: ['', [Validators.min(0)]],
      scoresPoints: [false],
      appliesGender: [false],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const type = this.type();
    if (type) {
      this.isEditing = true;
      this.form.patchValue({
        name: type.name,
        key: type.key,
        sortOrder: type.sortOrder || '',
        scoresPoints: type.scoresPoints || false,
        appliesGender: type.appliesGender || false,
        isActive: type.isActive
      });
      // Disable key field when editing
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      const nextOrder = this.facade.getNextSortOrder();
      this.form.patchValue({
        sortOrder: nextOrder,
        isActive: true,
        scoresPoints: false,
        appliesGender: false
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

    const nameExists = await this.facade.checkNameExists(formValue.name, this.type()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.type()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.type(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveType(payload);
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
      return `admin.tournament-types.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.tournament-types.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.tournament-types.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.tournament-types.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.tournament-types.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.tournament-types.error.sortOrderExists';
    }

    return 'admin.tournament-types.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
