import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { TournamentModality } from '../../../../../core/models';
import { ModalitiesFacadeService } from '../modalities-facade.service';

@Component({
  selector: 'app-modalities-form-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ActiveToggleComponent
  ],
  templateUrl: './modalities-form-panel.component.html',
  styleUrl: './modalities-form-panel.component.scss'
})
export class ModalitiesFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ModalitiesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly modality = input<TournamentModality | null>(null);
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
      nameEs: ['', [Validators.required]],
      nameEn: ['', [Validators.required]],
      namePt: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });

    // Auto-generate key from English name
    this.form.get('nameEn')?.valueChanges.subscribe(name => {
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
    const modality = this.modality();
    if (modality) {
      this.isEditing = true;
      this.form.patchValue({
        nameEs: modality.nameEs,
        nameEn: modality.nameEn,
        namePt: modality.namePt,
        key: modality.key,
        sortOrder: modality.sortOrder || '',
        isActive: modality.isActive
      });
      this.form.get('key')?.disable();

      if (!this.isSystemAdmin()) {
        this.form.get('nameEs')?.disable();
        this.form.get('nameEn')?.disable();
        this.form.get('namePt')?.disable();
        this.form.get('sortOrder')?.disable();
      }
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

    if (!this.form.valid) return;

    const formValue = this.form.getRawValue();

    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.modality()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? { ...this.modality(), ...formValue }
      : formValue;

    const success = await this.facade.saveModality(payload);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) return '';

    if (control.errors['required']) return `admin.modalities.error.${controlName}Required`;
    if (control.errors['pattern']) return `admin.modalities.error.${controlName}Pattern`;
    if (control.errors['min']) return 'admin.modalities.error.sortOrderMin';
    if (control.errors['keyExists']) return 'admin.modalities.error.keyExists';
    if (control.errors['sortOrderExists']) return 'admin.modalities.error.sortOrderExists';

    return 'admin.modalities.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
