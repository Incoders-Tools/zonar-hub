import { Component, inject, input, output, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { TournamentEligibilityProfile } from '../../../../../core/models';
import { TournamentEligibilityProfilesFacadeService } from '../tournament-eligibility-profiles-facade.service';
import { SlotEditorComponent } from '../slot-editor/slot-editor.component';

@Component({
  selector: 'app-tournament-eligibility-profiles-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    SlotEditorComponent
  ],
  templateUrl: './tournament-eligibility-profiles-form-dialog.component.html',
  styleUrl: './tournament-eligibility-profiles-form-dialog.component.scss'
})
export class TournamentEligibilityProfilesFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TournamentEligibilityProfilesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly profile = input<TournamentEligibilityProfile | null>(null);
  readonly saving = input(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;
  slotsExpanded = signal(false);

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
      isActive: [true],
      slots: this.fb.array([])
    });
  }

  private populateForm(): void {
    const profile = this.profile();
    if (profile) {
      this.isEditing = true;
      this.form.patchValue({
        name: profile.name,
        key: profile.key,
        description: profile.description || '',
        sortOrder: profile.sortOrder || '',
        isActive: profile.isActive
      });
      // Disable key field when editing
      this.form.get('key')?.disable();

      // Populate slots
      if (profile.slots && profile.slots.length > 0) {
        const slotsArray = this.form.get('slots') as FormArray;
        profile.slots.forEach(slot => {
          slotsArray.push(this.createSlotFormGroup(slot));
        });
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

  private createSlotFormGroup(slot?: any): FormGroup {
    return this.fb.group({
      slotNumber: [slot?.slotNumber || '', Validators.required],
      genderId: [slot?.genderId || ''],
      categoryId: [slot?.categoryId || ''],
      minAge: [slot?.minAge || ''],
      maxAge: [slot?.maxAge || ''],
      label: [slot?.label || '']
    });
  }

  get slotsArray(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  addSlot(): void {
    this.slotsArray.push(this.createSlotFormGroup());
  }

  removeSlot(index: number): void {
    this.slotsArray.removeAt(index);
  }

  toggleSlotsSection(): void {
    this.slotsExpanded.set(!this.slotsExpanded());
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

    const nameExists = await this.facade.checkNameExists(formValue.name, this.profile()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.profile()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.profile(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveProfile(payload);
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
      return `admin.tournament-eligibility-profiles.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.tournament-eligibility-profiles.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.tournament-eligibility-profiles.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.tournament-eligibility-profiles.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.tournament-eligibility-profiles.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.tournament-eligibility-profiles.error.sortOrderExists';
    }

    return 'admin.tournament-eligibility-profiles.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
