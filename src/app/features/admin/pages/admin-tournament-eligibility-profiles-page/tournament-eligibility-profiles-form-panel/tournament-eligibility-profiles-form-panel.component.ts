import { Component, inject, input, output, OnInit, computed } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { Category, Gender, TournamentEligibilityProfile, TournamentEligibilitySlot } from '../../../../../core/models';
import { EligibilityProfileWrite } from '../../../../../core/repositories/eligibility-profile.repository';
import { TournamentEligibilityProfilesFacadeService } from '../tournament-eligibility-profiles-facade.service';

/** Limits of the API profile contract (`EligibilityProfileBody`, `EligibilitySlotBody`). */
const NAME_MAX = 120;
const DESCRIPTION_MAX = 500;
const LABEL_MAX = 60;
const MAX_SLOT_NUMBER = 16;
const MAX_AGE = 120;

/** Row rule of the API `invalid_age_range`: a maximum age may not be below the minimum age. */
const ageRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const min = toNumberOrNull(group.get('minAge')?.value);
  const max = toNumberOrNull(group.get('maxAge')?.value);
  return min !== null && max !== null && max < min ? { ageRange: true } : null;
};

/** Collection rules of the API: at least one slot (`slots_required`) and no repeated slot number (`invalid_slot`). */
const slotsValidator: ValidatorFn = (array: AbstractControl): ValidationErrors | null => {
  const rows = (array as FormArray).controls;
  if (rows.length === 0) return { slotsRequired: true };
  const numbers = rows.map(row => toNumberOrNull(row.get('slotNumber')?.value)).filter((n): n is number => n !== null);
  return new Set(numbers).size !== numbers.length ? { duplicateSlot: true } : null;
};

@Component({
  selector: 'app-tournament-eligibility-profiles-form-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    ActiveToggleComponent,
    ChildCollectionGridComponent
  ],
  templateUrl: './tournament-eligibility-profiles-form-panel.component.html',
  styleUrl: './tournament-eligibility-profiles-form-panel.component.scss'
})
export class TournamentEligibilityProfilesFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TournamentEligibilityProfilesFacadeService);

  readonly profile = input<TournamentEligibilityProfile | null>(null);
  readonly saving = input(false);
  readonly genders = input<Gender[]>([]);
  readonly categories = input<Category[]>([]);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;

  readonly slotColumns = computed<ChildGridColumn[]>(() => [
    { key: 'slotNumber', labelKey: 'admin.tournament-eligibility-profiles.form.slotNumber', type: 'number', required: true, width: '90px' },
    { key: 'genderId', labelKey: 'admin.tournament-eligibility-profiles.form.genderId', type: 'select',
      options: this.genders().filter(g => g.isActive).map(g => ({ value: g.id, label: g.name })) },
    { key: 'categoryId', labelKey: 'admin.tournament-eligibility-profiles.form.categoryId', type: 'select',
      options: this.categories().filter(c => c.isActive).map(c => ({ value: c.id, label: c.name })) },
    { key: 'minAge', labelKey: 'admin.tournament-eligibility-profiles.form.minAge', type: 'number', width: '90px' },
    { key: 'maxAge', labelKey: 'admin.tournament-eligibility-profiles.form.maxAge', type: 'number', width: '90px' },
    { key: 'label', labelKey: 'admin.tournament-eligibility-profiles.form.label', type: 'text' },
    { key: 'required', labelKey: 'admin.tournament-eligibility-profiles.form.required', type: 'checkbox', width: '90px' }
  ]);

  /** New rows take the next free slot number, required by default (API default). */
  readonly slotRowFactory = (): FormGroup => {
    const used = this.slotsArray.controls.map(row => toNumberOrNull(row.get('slotNumber')?.value) ?? 0);
    return this.createSlotGroup({ slotNumber: Math.min(MAX_SLOT_NUMBER, Math.max(0, ...used) + 1) });
  };

  get isEditing(): boolean {
    return !!this.profile();
  }

  get slotsArray(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  ngOnInit(): void {
    const profile = this.profile();
    const slots = profile?.slots?.length ? profile.slots : [{ slotNumber: 1 }, { slotNumber: 2 }];
    this.form = this.fb.group({
      name: [profile?.name ?? '', [Validators.required, Validators.maxLength(NAME_MAX)]],
      description: [profile?.description ?? '', [Validators.maxLength(DESCRIPTION_MAX)]],
      isActive: [profile?.isActive ?? true],
      slots: this.fb.array(slots.map(slot => this.createSlotGroup(slot)), slotsValidator)
    });
  }

  /** Translation keys of every slot rule currently broken, shown under the grid. */
  get slotErrorKeys(): string[] {
    const keys = new Set<string>();
    if (this.slotsArray.hasError('slotsRequired')) keys.add('eligibility_profiles.errors.slots_required');
    if (this.slotsArray.hasError('duplicateSlot')) keys.add('admin.tournament-eligibility-profiles.validation.duplicateSlot');
    for (const row of this.slotsArray.controls) {
      if (row.get('slotNumber')?.invalid) keys.add('eligibility_profiles.errors.invalid_slot');
      if (row.get('minAge')?.invalid || row.get('maxAge')?.invalid || row.hasError('ageRange')) {
        keys.add('eligibility_profiles.errors.invalid_age_range');
      }
      if (row.get('label')?.invalid) keys.add('eligibility_profiles.errors.label_too_long');
    }
    return [...keys];
  }

  get nameTaken(): boolean {
    return this.facade.isNameTaken(this.form.get('name')?.value ?? '', this.profile()?.id);
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.nameTaken && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  async onSave(): Promise<void> {
    if (!this.canSubmit) return;
    const value = this.form.getRawValue();
    const payload: EligibilityProfileWrite = {
      name: value.name,
      description: value.description,
      // The API creates every profile active; the status only changes on update
      isActive: this.isEditing ? value.isActive : true,
      slots: (value.slots as Record<string, unknown>[]).map(slot => ({
        slotNumber: Number(slot['slotNumber']),
        genderId: (slot['genderId'] as string) || null,
        categoryId: (slot['categoryId'] as string) || null,
        minAge: toNumberOrNull(slot['minAge']),
        maxAge: toNumberOrNull(slot['maxAge']),
        label: (slot['label'] as string) || null,
        required: !!slot['required']
      }))
    };
    if (await this.facade.saveProfile(payload, this.profile()?.id)) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private createSlotGroup(slot: Partial<TournamentEligibilitySlot>): FormGroup {
    return this.fb.group({
      slotNumber: [slot.slotNumber ?? 1, [Validators.required, Validators.min(1), Validators.max(MAX_SLOT_NUMBER), Validators.pattern(/^\d+$/)]],
      genderId: [slot.genderId ?? ''],
      categoryId: [slot.categoryId ?? ''],
      minAge: [slot.minAge ?? null, [Validators.min(0), Validators.max(MAX_AGE)]],
      maxAge: [slot.maxAge ?? null, [Validators.min(0), Validators.max(MAX_AGE)]],
      label: [slot.label ?? '', [Validators.maxLength(LABEL_MAX)]],
      required: [slot.required ?? true]
    }, { validators: ageRangeValidator });
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
