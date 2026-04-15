import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { EntityKeyService } from '../../../../../shared/services/entity-key.service';
import { GenderFacadeService } from '../gender-facade.service';
import { Gender } from '../../../../../core/models';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-gender-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FormShellComponent, AsyncButtonComponent, ActiveToggleComponent],
  templateUrl: './gender-form-panel.component.html',
  styleUrl: './gender-form-panel.component.scss'
})
export class GenderFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly keyService = inject(EntityKeyService);
  private readonly facade = inject(GenderFacadeService);

  readonly gender = input<Gender | null>(null);
  readonly saving = input(false);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly isAdmin = inject(AuthService).isSystemAdmin;
  readonly keyConflict = signal(false);
  private existingKeys: string[] = [];

  form!: FormGroup;

  get isEditing(): boolean {
    return !!this.gender();
  }

  get titleKey(): string {
    return this.isEditing ? 'genders.form.editTitle' : 'genders.form.createTitle';
  }

  ngOnInit(): void {
    const g = this.gender();
    this.form = this.fb.group({
      name: [g?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      key: [g?.key ?? '', [Validators.required, Validators.maxLength(100)]],
      isActive: [g?.isActive ?? true],
      sortOrder: [g?.sortOrder ?? 1, [Validators.required, Validators.min(0)]]
    });

    if (!this.isAdmin()) {
      this.form.get('key')?.disable();
      this.form.get('sortOrder')?.disable();
    }

    this.loadExistingKeys();
    this.setupKeyAutoGeneration();
  }

  private async loadExistingKeys(): Promise<void> {
    this.existingKeys = await this.facade.getExistingKeys();
  }

  private setupKeyAutoGeneration(): void {
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditing || !this.form.get('key')?.dirty) {
        const generated = this.keyService.generateKey(name);
        this.form.get('key')?.setValue(generated, { emitEvent: false });
        this.validateKeyUniqueness(generated);
      }
    });

    this.form.get('key')?.valueChanges.subscribe((key: string) => {
      this.validateKeyUniqueness(key);
    });
  }

  private validateKeyUniqueness(key: string): void {
    const editId = this.gender()?.id;
    const keysToCheck = editId
      ? this.existingKeys.filter((_, i) => {
          const genders = this.facade.genders();
          return genders[i]?.id !== editId;
        })
      : this.existingKeys;
    this.keyConflict.set(keysToCheck.includes(key));
  }

  onNameBlur(): void {
    const name = this.form.get('name')?.value;
    if (name) {
      const normalized = this.keyService.normalizeName(name);
      this.form.get('name')?.setValue(normalized, { emitEvent: true });
    }
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.keyConflict() && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      key: value.key,
      isActive: value.isActive,
      sortOrder: value.sortOrder,
      createdAt: this.gender()?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await this.facade.save(payload, this.gender()?.id);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
