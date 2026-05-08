import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { Sport, TournamentModality } from '../../../../../core/models';
import { SportsFacadeService } from '../sports-facade.service';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { SportIconComponent } from '../../../../../shared/components/sport-icon/sport-icon.component';

@Component({
  selector: 'app-sports-form-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ActiveToggleComponent,
    SportIconComponent,
    ChildCollectionGridComponent
  ],
  templateUrl: './sports-form-panel.component.html',
  styleUrl: './sports-form-panel.component.scss'
})
export class SportsFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(SportsFacadeService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly sport = input<Sport | null>(null);
  readonly modalities = input<TournamentModality[]>([]);
  readonly saving = input(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly modalityColumns = computed<ChildGridColumn[]>(() => {
    const locale = this.i18n.locale();
    const nameKey = locale === 'en' ? 'nameEn' : locale === 'pt' ? 'namePt' : 'nameEs';
    return [{ key: nameKey, labelKey: 'admin.modalities.column.name', type: 'display' as const }];
  });

  readonly activeModalities = computed(() =>
    this.modalities().filter(m => m.isActive)
  );

  readonly selectedModalityIds = signal<Set<string>>(new Set());
  readonly orderedModalityIds = signal<string[]>([]);

  /** A sport must have at least one modality before it can be persisted. */
  readonly hasModalities = computed(() => this.selectedModalityIds().size > 0);
  readonly modalityRequiredError = signal(false);

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      icon: [''],
      iconSource: ['unicode'],
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
        iconSource: sport.iconSource || 'unicode',
        sortOrder: sport.sortOrder || '',
        isActive: sport.isActive
      });
      // Disable key field when editing
      this.form.get('key')?.disable();

      // Populate modality selection
      if (sport.modalityIds?.length) {
        this.selectedModalityIds.set(new Set(sport.modalityIds));
        this.orderedModalityIds.set([...sport.modalityIds]);
      }

      // Non-system-admins can only toggle isActive
      if (!this.isSystemAdmin()) {
        this.form.get('name')?.disable();
        this.form.get('icon')?.disable();
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
    this.modalityRequiredError.set(!this.hasModalities());

    if (!this.form.valid || !this.hasModalities()) {
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

    const orderedIds = this.orderedModalityIds().length > 0
      ? this.orderedModalityIds()
      : Array.from(this.selectedModalityIds());

    const payload = this.isEditing
      ? {
          ...this.sport(),
          ...formValue,
          modalityIds: orderedIds
        }
      : { ...formValue, modalityIds: orderedIds };

    const success = await this.facade.saveSport(payload);
    if (success) {
      this.saved.emit();
    }
  }

  onModalitySelectionChanged(ids: Set<string>): void {
    this.selectedModalityIds.set(ids);
    if (ids.size > 0) {
      this.modalityRequiredError.set(false);
    }
    this.form.markAsDirty();
  }

  onModalityOrderChanged(orderedIds: string[]): void {
    this.orderedModalityIds.set(orderedIds);
    this.form.markAsDirty();
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
