import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { EntityKeyService } from '../../../../../shared/services/entity-key.service';
import { CategoryFacadeService } from '../category-facade.service';
import { Category } from '../../../../../core/models';

function categoryNameValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const valid = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑçÇªº0-9\s\-]+$/.test(control.value);
  return valid ? null : { invalidCategoryName: true };
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, FormShellComponent, AsyncButtonComponent],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss'
})
export class CategoryFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly keyService = inject(EntityKeyService);
  private readonly facade = inject(CategoryFacadeService);

  readonly category = input<Category | null>(null);
  readonly saving = input(false);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly isAdmin = signal(true);
  readonly keyConflict = signal(false);
  readonly levelInferred = signal(false);
  private existingKeys: string[] = [];

  form!: FormGroup;

  get isEditing(): boolean {
    return !!this.category();
  }

  get titleKey(): string {
    return this.isEditing ? 'categories.form.editTitle' : 'categories.form.createTitle';
  }

  ngOnInit(): void {
    const cat = this.category();
    this.form = this.fb.group({
      name: [cat?.name ?? '', [Validators.required, Validators.maxLength(100), categoryNameValidator]],
      shortName: [cat?.shortName ?? '', [Validators.required, Validators.maxLength(20)]],
      key: [cat?.key ?? '', [Validators.required, Validators.maxLength(100)]],
      level: [cat?.level ?? 1, [Validators.required, Validators.min(1), Validators.max(99)]],
      isActive: [cat?.isActive ?? true],
      sortOrder: [cat?.sortOrder ?? 1, [Validators.required, Validators.min(0)]]
    });

    if (!this.isAdmin()) {
      this.form.get('key')?.disable();
    }

    this.loadExistingKeys();
    this.setupLevelInference();
    this.setupKeyAutoGeneration();
  }

  private async loadExistingKeys(): Promise<void> {
    this.existingKeys = await this.facade.getExistingKeys();
  }

  private setupLevelInference(): void {
    this.form.get('level')?.valueChanges.subscribe((level: number) => {
      if (!this.isEditing && level > 0) {
        const inferred = this.keyService.inferCategoryFromLevel(level);
        this.form.get('name')?.setValue(inferred.name, { emitEvent: false });
        this.form.get('shortName')?.setValue(inferred.shortName, { emitEvent: false });
        this.form.get('key')?.setValue(inferred.key, { emitEvent: false });
        this.form.get('sortOrder')?.setValue(inferred.sortOrder, { emitEvent: false });
        this.validateKeyUniqueness(inferred.key);
        this.levelInferred.set(true);
      }
    });
  }

  private setupKeyAutoGeneration(): void {
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditing || !this.form.get('key')?.dirty) {
        const generated = this.keyService.generateKey(name);
        this.form.get('key')?.setValue(generated, { emitEvent: false });
        this.validateKeyUniqueness(generated);
      }
      this.levelInferred.set(false);
    });

    this.form.get('key')?.valueChanges.subscribe((key: string) => {
      this.validateKeyUniqueness(key);
    });
  }

  private validateKeyUniqueness(key: string): void {
    const editId = this.category()?.id;
    const keysToCheck = editId
      ? this.existingKeys.filter((_, i) => {
          const cats = this.facade.categories();
          return cats[i]?.id !== editId;
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
      shortName: value.shortName,
      key: value.key,
      level: value.level,
      isActive: value.isActive,
      sortOrder: value.sortOrder,
      createdAt: this.category()?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await this.facade.save(payload, this.category()?.id);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
