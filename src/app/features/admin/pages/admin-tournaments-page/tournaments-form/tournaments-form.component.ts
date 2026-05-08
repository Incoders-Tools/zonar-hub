import { Component, inject, input, output, signal, computed, OnInit, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { Tournament } from '../../../../../core/models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { DateFormatService } from '../../../../../core/services/date-format.service';
import { TournamentsFacadeService } from '../tournaments-facade.service';
import { dateRangeValidator } from '../../../../../shared/validators/date-range.validator';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { DateInputComponent } from '../../../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-tournaments-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ChildCollectionGridComponent,
    ActiveToggleComponent,
    DateInputComponent
  ],
  templateUrl: './tournaments-form.component.html',
  styleUrl: './tournaments-form.component.scss'
})
export class TournamentsFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  readonly facade = inject(TournamentsFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateFormatService = inject(DateFormatService);

  readonly tournament = input<Tournament | null>(null);
  readonly saving = input(false);
  readonly saved = output<Partial<Tournament>>();
  readonly cancelled = output<void>();
  readonly isSystemAdmin = this.auth.isSystemAdmin;
  readonly dateFormatPlaceholder = this.dateFormatService.format;

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  // Lookup options derived from facade
  readonly complexOptions = computed(() =>
    this.facade.complexes().map(c => ({ value: c.id, label: c.name }))
  );
  readonly sportOptions = computed(() =>
    this.facade.sports().filter(s => s.isActive).map(s => ({ value: s.id, label: s.name }))
  );
  readonly modalityOptionsForSport = computed(() => {
    const sportId = this._selectedSportId();
    if (!sportId) return [];
    const locale = this.i18n.locale();
    return this.facade.getModalitiesForSport(sportId).map(m => ({
      value: m.id,
      label: locale === 'en' ? m.nameEn : locale === 'pt' ? m.namePt : m.nameEs
    }));
  });
  readonly genderOptions = computed(() =>
    this.facade.genders().map(g => ({ value: g.id, label: g.name }))
  );
  readonly categoryOptions = computed(() =>
    this.facade.categories().map(c => ({ value: c.id, label: c.name }))
  );
  readonly ruleSetOptions = computed(() => {
    const locale = this.i18n.locale();
    return this.facade.ruleSets().filter(r => r.isActive).map(r => {
      const description = locale === 'en'
        ? (r.descriptionEn ?? r.descriptionEs ?? '')
        : locale === 'pt'
          ? (r.descriptionPt ?? r.descriptionEs ?? '')
          : (r.descriptionEs ?? '');
      return {
        value: r.id,
        label: r.name,
        description: description ?? ''
      };
    });
  });

  readonly showGenderField = signal(true);
  readonly showPointsField = signal(true);
  readonly registrationEnabled = signal(false);
  private readonly _selectedSportId = signal<string>('');
  private readonly _selectedModalityId = signal<string>('');

  /** Dynamic label key for the max participants field, based on selected modality */
  readonly maxParticipantsLabelKey = computed(() => {
    const modalityId = this._selectedModalityId();
    if (!modalityId) return 'admin.tournaments.form.maxPairs';
    const sportId = this._selectedSportId();
    if (!sportId) return 'admin.tournaments.form.maxPairs';
    const modality = this.facade.getModalitiesForSport(sportId).find(m => m.id === modalityId);
    if (!modality) return 'admin.tournaments.form.maxPairs';
    switch (modality.key) {
      case 'single': return 'admin.tournaments.form.maxPlayers';
      case 'teams': return 'admin.tournaments.form.maxTeams';
      default: return 'admin.tournaments.form.maxPairs';
    }
  });

  // Courts selection
  readonly selectedCourtIds = signal<Set<string>>(new Set());

  readonly courtColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.tournaments.courts.column.name', type: 'display' },
    { key: 'surfaceType', labelKey: 'admin.tournaments.courts.column.surfaceType', type: 'display' },
    { key: 'isIndoor', labelKey: 'admin.tournaments.courts.column.isIndoor', type: 'checkbox' }
  ];

  // Date constraint computed signals
  readonly endDateMin = computed(() => this._startDate() || this.todayDate());
  readonly regStartMax = computed(() => this._startDate() || null);
  readonly regEndMin = computed(() => this._regStartDate() || null);
  readonly regEndMax = computed(() => this._startDate() || null);

  readonly todayDate = computed(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  readonly computedStatus = computed(() => {
    const startDate = this._startDate();
    const endDate = this._endDate();
    if (!startDate || !endDate) return null;
    return this.facade.computeStatus(startDate, endDate);
  });

  private readonly _startDate = signal<string>('');
  private readonly _endDate = signal<string>('');
  private readonly _regStartDate = signal<string>('');

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tournament'] && !changes['tournament'].firstChange) {
      this.initializeForm();
      this.populateForm();
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      complexId: ['', [Validators.required]],
      sportId: ['', [Validators.required]],
      modalityId: ['', [Validators.required]],
      ruleSetId: [''],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      genderId: ['', [Validators.required]],
      categoryId: [''],
      maxPairs: ['', [Validators.min(2)]],
      isActive: [true],
      registrationStartDate: [{ value: '', disabled: true }],
      registrationEndDate: [{ value: '', disabled: true }],
      registrationFeePerPair: [''],
      prizeMoney: [''],
      pointsToAward: [''],
      coverImageUrl: [''],
      observations: [''],
      description: [''],
      rules: [''],
      key: ['', [Validators.pattern(/^[a-z_]+$/)]],
      sortOrder: ['', [Validators.min(0)]]
    }, {
      validators: [
        dateRangeValidator('startDate', 'endDate'),
        dateRangeValidator('registrationStartDate', 'registrationEndDate')
      ]
    });

    // Auto-generate key from name
    this.form.get('name')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(name => {
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

    // Sport changes: update modality options and auto-select if only one
    this.form.get('sportId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sportId => {
      this._selectedSportId.set(sportId || '');
      const modalityCtrl = this.form.get('modalityId')!;
      if (!sportId) {
        modalityCtrl.setValue('', { emitEvent: false });
        this._selectedModalityId.set('');
        return;
      }
      const modalities = this.facade.getModalitiesForSport(sportId);
      if (modalities.length === 1) {
        modalityCtrl.setValue(modalities[0].id, { emitEvent: false });
        this._selectedModalityId.set(modalities[0].id);
      } else if (modalities.length > 1) {
        // Keep current selection if still valid, otherwise clear
        const current = modalityCtrl.value;
        if (!modalities.some(m => m.id === current)) {
          modalityCtrl.setValue('', { emitEvent: false });
          this._selectedModalityId.set('');
        }
      } else {
        modalityCtrl.setValue('', { emitEvent: false });
        this._selectedModalityId.set('');
      }
    });

    // Modality changes: update the selected modality signal
    this.form.get('modalityId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(modalityId => {
      this._selectedModalityId.set(modalityId || '');
    });

    // Complex changes: load courts for selected complex
    this.form.get('complexId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (complexId) => {
      await this.facade.loadCourtsForComplex(complexId || '');
      if (complexId) {
        // By default select all courts
        this.selectedCourtIds.set(new Set(this.facade.courtsForComplex().map(c => c.id)));
      } else {
        this.selectedCourtIds.set(new Set());
      }
    });

    // Date changes: update computed status and enable/disable registration fields
    this.form.get('startDate')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      this._startDate.set(value || '');
      this.updateRegistrationFieldsState();
    });

    this.form.get('endDate')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      this._endDate.set(value || '');
      this.updateRegistrationFieldsState();
    });

    this.form.get('registrationStartDate')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      this._regStartDate.set(value || '');
    });
  }

  private populateForm(): void {
    const tournament = this.tournament();
    this.submitted = false;

    if (tournament) {
      this.isEditing = true;

      // Set sport first so modality options are populated
      this._selectedSportId.set(tournament.sportId || '');
      this._selectedModalityId.set(tournament.modalityId || '');

      this.form.patchValue({
        name: tournament.name,
        complexId: tournament.complexId,
        sportId: tournament.sportId || '',
        modalityId: tournament.modalityId || '',
        ruleSetId: tournament.ruleSetId || '',
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        genderId: tournament.genderId || '',
        categoryId: tournament.categoryId || '',
        maxPairs: tournament.maxPairs,
        isActive: tournament.isActive ?? true,
        registrationStartDate: tournament.registrationStartDate || '',
        registrationEndDate: tournament.registrationEndDate || '',
        registrationFeePerPair: tournament.registrationFeePerPair || '',
        prizeMoney: tournament.prizeMoney || '',
        pointsToAward: tournament.pointsToAward || '',
        coverImageUrl: tournament.coverImageUrl || '',
        observations: tournament.observations || '',
        description: tournament.description || '',
        rules: tournament.rules || '',
        key: tournament.key || '',
        sortOrder: ''
      });

      this.form.get('key')?.disable();

      this._startDate.set(tournament.startDate || '');
      this._endDate.set(tournament.endDate || '');

      this.updateRegistrationFieldsState();

      // Load courts and restore selection
      if (tournament.complexId) {
        this.facade.loadCourtsForComplex(tournament.complexId).then(() => {
          if (tournament.selectedCourtIds?.length) {
            this.selectedCourtIds.set(new Set(tournament.selectedCourtIds));
          } else {
            this.selectedCourtIds.set(new Set(this.facade.courtsForComplex().map(c => c.id)));
          }
        });
      }
    } else {
      this.isEditing = false;
      this.form.get('key')?.enable();
      const nextOrder = this.facade.getNextSortOrder();
      this.form.patchValue({
        sortOrder: nextOrder,
        isActive: true
      });
    }
  }

  private updateRegistrationFieldsState(): void {
    const startDate = this.form.get('startDate')?.value;
    const endDate = this.form.get('endDate')?.value;
    const enabled = !!startDate && !!endDate;
    this.registrationEnabled.set(enabled);

    if (enabled) {
      this.form.get('registrationStartDate')?.enable({ emitEvent: false });
      this.form.get('registrationEndDate')?.enable({ emitEvent: false });
    } else {
      this.form.get('registrationStartDate')?.disable({ emitEvent: false });
      this.form.get('registrationEndDate')?.disable({ emitEvent: false });
    }
  }

  onCourtsSelectionChanged(ids: Set<string>): void {
    this.selectedCourtIds.set(ids);
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();

    // Validate uniqueness
    if (!this.isEditing && formValue.key) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.tournament()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const status = this.facade.computeStatus(formValue.startDate, formValue.endDate);

    const payload: Partial<Tournament> = {
      ...formValue,
      complexName: this.facade.getComplexName(formValue.complexId),
      sportId: formValue.sportId,
      sportName: this.facade.getSportName(formValue.sportId),
      modalityId: formValue.modalityId,
      modalityName: this.facade.getModalityName(formValue.modalityId),
      ruleSetId: formValue.ruleSetId || undefined,
      ruleSetDescription: formValue.ruleSetId ? this.facade.getRuleSetDescription(formValue.ruleSetId) : undefined,
      genderLabel: this.facade.getGenderLabel(formValue.genderId),
      categoryName: this.facade.getCategoryName(formValue.categoryId),
      statusLabel: status.labelKey,
      statusId: status.key,
      maxPairs: formValue.maxPairs ? Number(formValue.maxPairs) : null,
      registrationFeePerPair: formValue.registrationFeePerPair ? Number(formValue.registrationFeePerPair) : undefined,
      prizeMoney: formValue.prizeMoney ? Number(formValue.prizeMoney) : undefined,
      pointsToAward: formValue.pointsToAward ? Number(formValue.pointsToAward) : undefined,
      selectedCourtIds: Array.from(this.selectedCourtIds())
    };

    if (this.isEditing) {
      (payload as Tournament).id = this.tournament()!.id;
      (payload as Tournament).createdAt = this.tournament()!.createdAt;
    }

    const success = await this.facade.saveTournament(payload as Tournament);
    if (success) {
      this.saved.emit(payload);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getCourtEmptyMessageKey(): string {
    const complexId = this.form.get('complexId')?.value;
    const courts = this.facade.courtsForComplex();
    const loading = this.facade.loadingCourts();
    
    if (loading) {
      return 'admin.tournaments.courts.loading';
    }
    
    if (!complexId) {
      return 'admin.tournaments.courts.selectComplex';
    }
    
    if (courts.length === 0) {
      return 'admin.tournaments.courts.noCourtsForComplex';
    }
    
    return 'admin.tournaments.courts.empty';
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.tournaments.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.tournaments.error.${controlName}Pattern`;
    }
    if (control.errors['min']) {
      return `admin.tournaments.error.${controlName}Min`;
    }
    if (control.errors['keyExists']) {
      return 'admin.tournaments.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.tournaments.error.nameExists';
    }
    if (control.errors['dateRangeInvalid']) {
      return 'admin.tournaments.error.dateRangeInvalid';
    }

    return 'admin.tournaments.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (this.submitted && control?.invalid) || false;
  }
}
