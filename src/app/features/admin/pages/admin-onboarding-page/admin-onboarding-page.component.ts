import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockOrganizationRepository } from '../../../../core/repositories/mock/mock-organization.repository';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { AppLocale } from '../../../../core/i18n/i18n.types';
import { Sport, OrganizationType } from '../../../../core/models';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (start && end && start > end) {
    return { dateRangeInvalid: true };
  }
  return null;
}

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (value < today) return { pastDate: true };
  return null;
}

interface OrgTypeOption {
  value: OrganizationType;
  labelKey: string;
  descKey: string;
  icon: string;
}

@Component({
  selector: 'app-admin-onboarding-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    StepperComponent,
    AsyncButtonComponent,
    FormShellComponent
  ],
  templateUrl: './admin-onboarding-page.component.html',
  styleUrl: './admin-onboarding-page.component.scss'
})
export class AdminOnboardingPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly auth = inject(AuthService);
  private readonly complexRepo = inject(MockComplexRepository);
  private readonly orgRepo = inject(MockOrganizationRepository);
  private readonly sportRepo = inject(MockSportRepository);
  private readonly activeOrgService = inject(ActiveOrganizationService);
  private readonly tournamentService = inject(TournamentService);
  protected readonly userPrefs = inject(UserPreferencesService);
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dateFormatService = inject(DateFormatService);
  private readonly subs: Subscription[] = [];

  readonly currentStep = signal(0);
  readonly saving = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);

  /** Available sports loaded from repo */
  readonly availableSports = signal<Sport[]>([]);

  /** Track form validity as signals */
  private readonly organizationValid = signal(false);
  private readonly venueValid = signal(false);
  private readonly sportValid = signal(false);
  private readonly tournamentValid = signal(false);

  readonly totalSteps = 5;

  readonly steps = computed<StepperStep[]>(() => {
    const step = this.currentStep();
    return [
      { labelKey: 'onboarding.step.organization', completed: step > 0 },
      { labelKey: 'onboarding.step.systemConfig', completed: step > 1 },
      { labelKey: 'onboarding.step.venue', completed: step > 2 },
      { labelKey: 'onboarding.step.sports', completed: step > 3 },
      { labelKey: 'onboarding.step.tournament', completed: step > 4 }
    ];
  });

  /** System configuration options */
  readonly systemLocale = computed(() => this.userPrefs.getSystemDefaults().locale);
  readonly systemTheme = computed(() => this.userPrefs.getSystemDefaults().theme);
  readonly systemTimezone = computed(() => this.userPrefs.getSystemDefaults().timezone);
  readonly systemDateFormat = computed(() => this.userPrefs.getSystemDefaults().dateFormat);

  readonly locales: { value: AppLocale; labelKey: string }[] = [
    { value: 'es', labelKey: 'settings.language.es' },
    { value: 'en', labelKey: 'settings.language.en' },
    { value: 'pt', labelKey: 'settings.language.pt' }
  ];

  readonly themes: { value: AppTheme; labelKey: string }[] = [
    { value: 'court-energy', labelKey: 'settings.theme.courtEnergy' },
    { value: 'clay-match', labelKey: 'settings.theme.clayMatch' },
    { value: 'night-arena', labelKey: 'settings.theme.nightArena' }
  ];

  readonly timezones = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/Santiago', label: 'Santiago (UTC-4)' },
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
    { value: 'America/Lima', label: 'Lima (UTC-5)' },
    { value: 'America/Montevideo', label: 'Montevideo (UTC-3)' },
    { value: 'America/Caracas', label: 'Caracas (UTC-4)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' }
  ];

  readonly dateFormats = [
    { value: 'dd/MM/yyyy', example: '25/01/2025' },
    { value: 'MM/dd/yyyy', example: '01/25/2025' },
    { value: 'yyyy-MM-dd', example: '2025-01-25' },
    { value: 'dd-MM-yyyy', example: '25-01-2025' },
    { value: 'dd.MM.yyyy', example: '25.01.2025' }
  ];

  /** Step 0: Organization */
  readonly orgForm = new FormGroup({
    displayName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    type: new FormControl<OrganizationType>('circuito', [Validators.required])
  });

  readonly orgTypeOptions: OrgTypeOption[] = [
    { value: 'estandar', labelKey: 'organization.type.estandar', descKey: 'organization.type.estandar.desc', icon: '🏢' },
    { value: 'circuito', labelKey: 'organization.type.circuito', descKey: 'organization.type.circuito.desc', icon: '🏆' },
    { value: 'operadora', labelKey: 'organization.type.operadora', descKey: 'organization.type.operadora.desc', icon: '🎯' },
    { value: 'academia', labelKey: 'organization.type.academia', descKey: 'organization.type.academia.desc', icon: '🎓' },
    { value: 'marca', labelKey: 'organization.type.marca', descKey: 'organization.type.marca.desc', icon: '🏷️' }
  ];

  /** Step 1: System Configuration — always valid (has defaults) */

  /** Step 2: Venue (Sede) + Courts */
  readonly venueForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    location: new FormControl(''),
    address: new FormControl('', [Validators.required]),
    courtsCount: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(50)]),
    courtNames: new FormArray<FormControl<string>>([])
  });

  /** Step 3: Sports selection (signal-based, not form) */
  readonly selectedSportIds = signal<Set<string>>(new Set());

  /** Step 4: Tournament (optional) */
  readonly tournamentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    startDate: new FormControl('', [Validators.required, futureDateValidator]),
    endDate: new FormControl('', [Validators.required])
  }, { validators: dateRangeValidator });

  get tournamentStartDateMin(): string {
    return this.today;
  }

  get tournamentEndDateMin(): string {
    return this.tournamentForm.get('startDate')?.value || this.today;
  }

  get courtNamesArray(): FormArray<FormControl<string>> {
    return this.venueForm.get('courtNames') as FormArray<FormControl<string>>;
  }

  readonly canProceed = computed(() => {
    const step = this.currentStep();
    switch (step) {
      case 0: return this.organizationValid();
      case 1: return true; // system config always has defaults
      case 2: return this.venueValid();
      case 3: return this.sportValid();
      case 4: return this.tournamentValid();
      default: return false;
    }
  });

  async ngOnInit(): Promise<void> {
    this.subs.push(
      this.orgForm.statusChanges.subscribe(() => this.organizationValid.set(this.orgForm.valid)),
      this.venueForm.statusChanges.subscribe(() => this.venueValid.set(this.venueForm.valid)),
      this.tournamentForm.statusChanges.subscribe(() => this.tournamentValid.set(this.tournamentForm.valid))
    );

    this.organizationValid.set(this.orgForm.valid);
    this.venueValid.set(this.venueForm.valid);
    this.tournamentValid.set(this.tournamentForm.valid);

    // Load sports from repository
    const sports = await this.sportRepo.getAll();
    this.availableSports.set(sports.filter(s => s.isActive));

    // Generate initial court name
    this.syncCourtNames(1);

    // Listen to courts count changes
    this.subs.push(
      this.venueForm.get('courtsCount')!.valueChanges.subscribe(count => {
        this.syncCourtNames(count ?? 1);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  /** Sync FormArray of court names with count */
  private syncCourtNames(count: number): void {
    const arr = this.courtNamesArray;
    while (arr.length > count) {
      arr.removeAt(arr.length - 1);
    }
    while (arr.length < count) {
      const idx = arr.length + 1;
      arr.push(new FormControl(`Cancha ${idx}`, { nonNullable: true }));
    }
  }

  /** System config actions */
  onLocaleChange(locale: string): void {
    this.userPrefs.updateSystemDefaults({ locale: locale as AppLocale });
    this.userPrefs.applyEffectiveSettings();
  }

  onThemeChange(theme: string): void {
    this.userPrefs.updateSystemDefaults({ theme: theme as AppTheme });
    this.userPrefs.applyEffectiveSettings();
  }

  onTimezoneChange(tz: string): void {
    this.userPrefs.updateSystemDefaults({ timezone: tz });
    this.userPrefs.applyEffectiveSettings();
  }

  onDateFormatChange(fmt: string): void {
    this.userPrefs.updateSystemDefaults({ dateFormat: fmt });
    this.userPrefs.applyEffectiveSettings();
  }

  /** Sport multi-select */
  toggleSport(sportId: string): void {
    const current = new Set(this.selectedSportIds());
    if (current.has(sportId)) {
      current.delete(sportId);
    } else {
      current.add(sportId);
    }
    this.selectedSportIds.set(current);
    this.sportValid.set(current.size > 0);
  }

  isSportSelected(sportId: string): boolean {
    return this.selectedSportIds().has(sportId);
  }

  /** Organization type selection */
  selectOrgType(type: OrganizationType): void {
    this.orgForm.get('type')!.setValue(type);
  }

  isOrgTypeSelected(type: OrganizationType): boolean {
    return this.orgForm.get('type')!.value === type;
  }

  /** Navigation */
  nextStep(): void {
    const current = this.currentStep();
    if (current < this.totalSteps - 1) {
      const next = current + 1;
      this.currentStep.set(next);
      this.onboarding.updateWizardStep(next);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 0) {
      const prev = current - 1;
      this.currentStep.set(prev);
      this.onboarding.updateWizardStep(prev);
    }
  }

  onStepChanged(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  /** Finish: persist all data and navigate */
  async finishSetup(): Promise<void> {
    this.saving.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const session = this.auth.session();
      const tenantId = session?.tenant?.id ?? 'tenant-1';
      const userId = session?.user?.id ?? 'u-1';

      // 1. Persist organization
      const orgValues = this.orgForm.value;
      await this.orgRepo.create({
        displayName: orgValues.displayName ?? '',
        type: orgValues.type ?? 'circuito',
        isActive: true,
        tenantId,
        createdByUserId: userId
      });

      // 1b. Set this org as the active and primary organization
      this.activeOrgService.setOnboardingOrganization(tenantId);

      // 2. Update tenant name from org name
      if (session?.tenant) {
        session.tenant.name = orgValues.displayName ?? session.tenant.name;
      }

      // 3. Persist venue (complex)
      const venueValues = this.venueForm.getRawValue();
      const sportIds = [...this.selectedSportIds()];
      const createdComplex = await this.complexRepo.create({
        name: venueValues.name,
        key: (venueValues.name ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_'),
        address: venueValues.address,
        location: venueValues.location,
        cityId: 'city-1',
        cityName: '',
        sortOrder: 0,
        preponderance: 0,
        sportsSupported: sportIds,
        courtsCount: venueValues.courtsCount,
        isActive: true
      } as any);

      // 4. Persist courts with custom names
      for (let i = 0; i < venueValues.courtNames.length; i++) {
        await this.complexRepo.createCourt({
          complexId: createdComplex.id,
          name: venueValues.courtNames[i] || `Cancha ${i + 1}`,
          surfaceType: 'indoor',
          sportIds,
          isActive: true,
          isIndoor: true
        });
      }

      // 5. Activate selected sports, deactivate the rest
      const allSports = await this.sportRepo.getAll();
      for (const sport of allSports) {
        const shouldBeActive = sportIds.includes(sport.id);
        if (sport.isActive !== shouldBeActive) {
          await this.sportRepo.update(sport.id, { isActive: shouldBeActive });
        }
      }

      // 6. Persist tournament (if filled)
      const tValues = this.tournamentForm.value;
      if (tValues.name && tValues.startDate && tValues.endDate) {
        await this.tournamentService.saveTournament({
          name: tValues.name,
          startDate: tValues.startDate,
          endDate: tValues.endDate,
          complexId: createdComplex.id,
          complexName: venueValues.name,
          statusId: 'ts1',
          statusLabel: 'Próximo',
          sportId: sportIds[0] ?? 'sp1',
          sportName: this.availableSports().find(s => s.id === sportIds[0])?.name ?? ''
        } as any);
      }

      this.onboarding.completeWizard(!!tValues.name);
      this.notifications.success('onboarding.toast.success');
      this.router.navigate(['/admin']);
    } catch {
      this.notifications.error('onboarding.toast.error');
    } finally {
      this.saving.set(false);
    }
  }

  skipSetup(): void {
    this.onboarding.skipWizard();
    this.router.navigate(['/admin']);
  }

  /** Finish without tournament — persist org, venue, sports only */
  async finishWithoutTournament(): Promise<void> {
    this.tournamentForm.reset();
    await this.finishSetup();
  }

  /** Courts counter buttons */
  incrementCourts(): void {
    const ctrl = this.venueForm.get('courtsCount')!;
    const current = ctrl.value ?? 1;
    if (current < 50) ctrl.setValue(current + 1);
  }

  decrementCourts(): void {
    const ctrl = this.venueForm.get('courtsCount')!;
    const current = ctrl.value ?? 1;
    if (current > 1) ctrl.setValue(current - 1);
  }
}
