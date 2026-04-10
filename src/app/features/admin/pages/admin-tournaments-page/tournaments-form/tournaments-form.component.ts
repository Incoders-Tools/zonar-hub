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
import { DateFormatService } from '../../../../../core/services/date-format.service';
import { TournamentsFacadeService } from '../tournaments-facade.service';
import { dateRangeValidator } from '../../../../../shared/validators/date-range.validator';

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
    ChildCollectionGridComponent
  ],
  templateUrl: './tournaments-form.component.html',
  styleUrl: './tournaments-form.component.scss'
})
export class TournamentsFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
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
  readonly tournamentTypeOptions = computed(() =>
    this.facade.tournamentTypes().map(t => ({ value: t.id, label: t.name }))
  );
  readonly genderOptions = computed(() =>
    this.facade.genders().map(g => ({ value: g.id, label: g.name }))
  );
  readonly categoryOptions = computed(() =>
    this.facade.categories().map(c => ({ value: c.id, label: c.name }))
  );

  readonly showGenderField = signal(true);
  readonly showPointsField = signal(true);
  readonly registrationEnabled = signal(false);
  readonly derivedSport = signal<{ sportId: string; sportName: string } | null>(null);

  // Courts selection
  readonly selectedCourtIds = signal<Set<string>>(new Set());

  readonly courtColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.tournaments.courts.column.name', type: 'display' },
    { key: 'surfaceType', labelKey: 'admin.tournaments.courts.column.surfaceType', type: 'display' },
    { key: 'isIndoor', labelKey: 'admin.tournaments.courts.column.isIndoor', type: 'checkbox' }
  ];

  // Date constraint computed signals
  readonly endDateMin = computed(() => this._startDate() || null);
  readonly regStartMax = computed(() => this._startDate() || null);
  readonly regEndMin = computed(() => this._regStartDate() || null);
  readonly regEndMax = computed(() => this._startDate() || null);

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
      tournamentTypeId: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      genderId: [''],
      categoryId: [''],
      maxPairs: ['', [Validators.required, Validators.min(2)]],
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

    // Tournament type changes: show/hide gender and points fields based on type flags
    this.form.get('tournamentTypeId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(typeId => {
      this.showGenderField.set(this.facade.typeAppliesGender(typeId));
      this.showPointsField.set(this.facade.typeScoresPoints(typeId));
      if (!this.facade.typeAppliesGender(typeId)) {
        this.form.get('genderId')?.setValue('');
      }
      if (!this.facade.typeScoresPoints(typeId)) {
        this.form.get('pointsToAward')?.setValue('');
      }
      const sport = typeId ? this.facade.getSportForType(typeId) : null;
      this.derivedSport.set(sport?.sportId ? sport : null);
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
      this.form.patchValue({
        name: tournament.name,
        complexId: tournament.complexId,
        tournamentTypeId: tournament.tournamentTypeId,
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

      this.showGenderField.set(this.facade.typeAppliesGender(tournament.tournamentTypeId));
      this.showPointsField.set(this.facade.typeScoresPoints(tournament.tournamentTypeId));
      this.updateRegistrationFieldsState();

      const sport = tournament.tournamentTypeId ? this.facade.getSportForType(tournament.tournamentTypeId) : null;
      this.derivedSport.set(sport?.sportId ? sport : null);

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
    const sport = this.facade.getSportForType(formValue.tournamentTypeId);

    const payload: Partial<Tournament> = {
      ...formValue,
      complexName: this.facade.getComplexName(formValue.complexId),
      tournamentTypeName: this.facade.getTournamentTypeName(formValue.tournamentTypeId),
      sportId: sport.sportId,
      sportName: sport.sportName,
      genderLabel: this.facade.getGenderLabel(formValue.genderId),
      categoryName: this.facade.getCategoryName(formValue.categoryId),
      statusLabel: status.labelKey,
      statusId: status.key,
      maxPairs: Number(formValue.maxPairs),
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
