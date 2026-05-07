import { Component, inject, signal, computed, effect, viewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ApiOnboardingRepository } from '../../../../core/repositories/api/api-onboarding.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { MockTournamentAdminRepository } from '../../../../core/repositories/mock/mock-tournament-admin.repository';
import { AppLocale } from '../../../../core/i18n/i18n.types';
import { Sport, OrganizationType, Complex } from '../../../../core/models';

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
    FormShellComponent,
    DateInputComponent,
    DateInputComponent
  ],
  templateUrl: './admin-onboarding-page.component.html',
  styleUrl: './admin-onboarding-page.component.scss'
})
export class AdminOnboardingPageComponent implements OnInit, OnDestroy {
  private readonly uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly auth = inject(AuthService);
  private readonly sportRepo = inject(ApiSportRepository);
  private readonly onboardingRepo = inject(ApiOnboardingRepository);
  private readonly complexRepo = inject(ApiComplexRepository);
  private readonly tournamentRepo = inject(MockTournamentAdminRepository);
  private readonly activeOrgService = inject(ActiveOrganizationService);
  protected readonly userPrefs = inject(UserPreferencesService);
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dateFormatService = inject(DateFormatService);
  private readonly subs: Subscription[] = [];
  private orgFieldSpotlightTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly currentStep = signal(0);
  readonly saving = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);

  /** Reactive count of court rows (mirrors courtNames FormArray length) */
  readonly courtRowsCount = signal(0);

  /** Auto-focus targets per step */
  readonly orgNameInput = viewChild<ElementRef<HTMLInputElement>>('orgNameInput');
  readonly venueNameInput = viewChild<ElementRef<HTMLInputElement>>('venueNameInput');
  readonly tournamentNameInput = viewChild<ElementRef<HTMLInputElement>>('tournamentNameInput');

  /** Available sports loaded from repo */
  readonly availableSports = signal<Sport[]>([]);

  /** Track form validity as signals */
  private readonly organizationValid = signal(false);
  private readonly venueValid = signal(false);
  private readonly sportValid = signal(false);
  private readonly tournamentValid = signal(false);
  readonly showOrgFieldSpotlight = signal(false);
  readonly showVenueFieldSpotlight = signal(false);
  readonly showTournamentFieldSpotlight = signal(false);
  private venueFieldSpotlightTimeout: ReturnType<typeof setTimeout> | null = null;
  private tournamentFieldSpotlightTimeout: ReturnType<typeof setTimeout> | null = null;
  private static readonly SPOTLIGHT_DURATION_MS = 5400;

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

  /** Step 3: Sports selection (signal-based, not form). Order is preserved
   *  so the first sport selected is treated as the primary one. */
  readonly selectedSportIdsOrder = signal<string[]>([]);
  readonly selectedSportIds = computed<Set<string>>(() => new Set(this.selectedSportIdsOrder()));
  readonly primarySportId = computed<string | null>(() => this.selectedSportIdsOrder()[0] ?? null);
  readonly hasMultipleSports = computed<boolean>(() => this.selectedSportIdsOrder().length > 1);
  readonly primarySport = computed(() => {
    const id = this.primarySportId();
    if (!id) return null;
    return this.availableSports().find(s => s.id === id) ?? null;
  });

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

  constructor() {
    // Auto-focus the first editable field of each step as soon as it becomes
    // visible, so the user can type without an extra click.
    effect(() => {
      const step = this.currentStep();
      if (step === 0) {
        queueMicrotask(() => {
          this.orgNameInput()?.nativeElement?.focus();
          this.activateOrgFieldSpotlight();
        });
      } else if (step === 2) {
        queueMicrotask(() => this.venueNameInput()?.nativeElement?.focus());
      } else if (step === 4) {
        queueMicrotask(() => this.tournamentNameInput()?.nativeElement?.focus());
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.subs.push(
      this.orgForm.statusChanges.subscribe(() => this.organizationValid.set(this.orgForm.valid)),
      this.venueForm.statusChanges.subscribe(() => this.venueValid.set(this.venueForm.valid)),
      this.tournamentForm.statusChanges.subscribe(() => this.tournamentValid.set(this.tournamentForm.valid)),
      this.orgForm.get('displayName')!.valueChanges.subscribe(value => {
        if ((value ?? '').trim().length > 0) {
          this.clearOrgFieldSpotlight();
        }
      })
    );

    this.organizationValid.set(this.orgForm.valid);
    this.venueValid.set(this.venueForm.valid);
    this.tournamentValid.set(this.tournamentForm.valid);

    // Restore wizard step if user abandoned and came back
    const savedStep = this.onboarding.wizardStep();
    if (savedStep > 0) {
      this.currentStep.set(savedStep);
    }

    // Onboarding must offer only globally active sports.
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
    if (this.orgFieldSpotlightTimeout) {
      clearTimeout(this.orgFieldSpotlightTimeout);
      this.orgFieldSpotlightTimeout = null;
    }
    if (this.venueFieldSpotlightTimeout) {
      clearTimeout(this.venueFieldSpotlightTimeout);
      this.venueFieldSpotlightTimeout = null;
    }
    if (this.tournamentFieldSpotlightTimeout) {
      clearTimeout(this.tournamentFieldSpotlightTimeout);
      this.tournamentFieldSpotlightTimeout = null;
    }
  }

  private activateOrgFieldSpotlight(): void {
    this.showOrgFieldSpotlight.set(true);
    if (this.orgFieldSpotlightTimeout) {
      clearTimeout(this.orgFieldSpotlightTimeout);
    }

    this.orgFieldSpotlightTimeout = setTimeout(() => {
      this.showOrgFieldSpotlight.set(false);
      this.orgFieldSpotlightTimeout = null;
    }, AdminOnboardingPageComponent.SPOTLIGHT_DURATION_MS);
  }

  private clearOrgFieldSpotlight(): void {
    if (this.orgFieldSpotlightTimeout) {
      clearTimeout(this.orgFieldSpotlightTimeout);
      this.orgFieldSpotlightTimeout = null;
    }
    this.showOrgFieldSpotlight.set(false);
  }

  private activateVenueFieldSpotlight(): void {
    this.showVenueFieldSpotlight.set(true);
    if (this.venueFieldSpotlightTimeout) {
      clearTimeout(this.venueFieldSpotlightTimeout);
    }
    this.venueFieldSpotlightTimeout = setTimeout(() => {
      this.showVenueFieldSpotlight.set(false);
      this.venueFieldSpotlightTimeout = null;
    }, AdminOnboardingPageComponent.SPOTLIGHT_DURATION_MS);
  }

  private activateTournamentFieldSpotlight(): void {
    this.showTournamentFieldSpotlight.set(true);
    if (this.tournamentFieldSpotlightTimeout) {
      clearTimeout(this.tournamentFieldSpotlightTimeout);
    }
    this.tournamentFieldSpotlightTimeout = setTimeout(() => {
      this.showTournamentFieldSpotlight.set(false);
      this.tournamentFieldSpotlightTimeout = null;
    }, AdminOnboardingPageComponent.SPOTLIGHT_DURATION_MS);
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
    this.courtRowsCount.set(arr.length);
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

  /** Sport multi-select. Insertion order is preserved so the first selection
   *  becomes the primary sport. */
  toggleSport(sportId: string): void {
    const current = this.selectedSportIdsOrder();
    const next = current.includes(sportId)
      ? current.filter(id => id !== sportId)
      : [...current, sportId];
    this.selectedSportIdsOrder.set(next);
    this.sportValid.set(next.length > 0);
  }

  isSportSelected(sportId: string): boolean {
    return this.selectedSportIdsOrder().includes(sportId);
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
      this.triggerStepSpotlight(next);
    }
  }

  private triggerStepSpotlight(step: number): void {
    if (step === 2) {
      this.activateVenueFieldSpotlight();
    } else if (step === 4) {
      this.activateTournamentFieldSpotlight();
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
  async finishSetup(skipTournament = false): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);

    try {
      const session = this.auth.session();
      const tenantId = session?.user?.tenantId ?? session?.tenant?.id ?? '';
      const userId = session?.user?.id ?? '';

      if (!this.uuidPattern.test(tenantId) || !this.uuidPattern.test(userId)) {
        throw new Error('onboarding.toast.error');
      }

      const orgValues = this.orgForm.value;
      const venueValues = this.venueForm.getRawValue();
      // Preserve selection order so the primary sport (index 0) is the one
      // used for the optional tournament created in the next step.
      const sportIds = [...this.selectedSportIdsOrder()];

      const tValues = this.tournamentForm.value;
      const includeTournament = !skipTournament && !!tValues.name && !!tValues.startDate && !!tValues.endDate;

      const result = await this.onboardingRepo.complete({
        tenantId,
        createdByUserId: userId,
        organizationDisplayName: orgValues.displayName ?? '',
        organizationType: orgValues.type ?? 'circuito',
        systemSettings: {
          locale: this.systemLocale(),
          theme: this.systemTheme(),
          timezone: this.systemTimezone(),
          dateFormat: this.systemDateFormat()
        },
        venue: {
          name: venueValues.name ?? '',
          address: venueValues.address ?? '',
          location: venueValues.location,
          courtNames: venueValues.courtNames ?? []
        },
        enabledSportIds: sportIds,
        tournament: includeTournament
          ? {
            name: tValues.name!,
            startDate: tValues.startDate!,
            endDate: tValues.endDate!
          }
          : null
      });

      const organizationName = orgValues.displayName ?? session?.tenant?.name ?? '';
      this.auth.updateCurrentOrganization(result.organizationId, organizationName);
      this.auth.updateCurrentOrganizationAssignments(result.organizationId, [result.organizationId]);
      this.activeOrgService.setOnboardingOrganization(result.organizationId);

      await this.syncOnboardingEntitiesToLocalAdminTools(
        result,
        result.organizationId,
        organizationName,
        venueValues.name ?? '',
        venueValues.address ?? '',
        venueValues.location,
        venueValues.courtNames ?? [],
        sportIds,
        includeTournament,
        tValues.name ?? '',
        tValues.startDate ?? '',
        tValues.endDate ?? ''
      );

      this.onboarding.completeWizard(includeTournament);
      this.onboarding.markOrganizationCreated();
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
    await this.finishSetup(true);
  }

  private async syncOnboardingEntitiesToLocalAdminTools(
    result: { complexId?: string | null; tournamentId?: string | null },
    organizationId: string,
    organizationName: string,
    venueName: string,
    venueAddress: string,
    venueLocation: string | null | undefined,
    courtNames: string[],
    enabledSportIds: string[],
    includeTournament: boolean,
    tournamentName: string,
    tournamentStartDate: string,
    tournamentEndDate: string
  ): Promise<void> {
    try {
      const complex = await this.ensureOnboardingComplex(
        result,
        organizationId,
        organizationName,
        venueName,
        venueAddress,
        venueLocation,
        courtNames,
        enabledSportIds
      );

      if (
        includeTournament &&
        result.tournamentId &&
        tournamentName.trim().length > 0 &&
        tournamentStartDate &&
        tournamentEndDate
      ) {
        await this.ensureOnboardingTournament(
          organizationId,
          organizationName,
          complex,
          venueName,
          enabledSportIds,
          tournamentName,
          tournamentStartDate,
          tournamentEndDate
        );
      }
    } catch {
      // Onboarding completion is source-of-truth in backend. Local sync is best effort only.
    }
  }

  private async ensureOnboardingComplex(
    result: { complexId?: string | null },
    _organizationId: string,
    _organizationName: string,
    venueName: string,
    _venueAddress: string,
    _venueLocation: string | null | undefined,
    _courtNames: string[],
    _enabledSportIds: string[]
  ): Promise<Complex | null> {
    if (!result.complexId || venueName.trim().length === 0) {
      return null;
    }

    // The complex (and its courts) are persisted by the onboarding endpoint
    // server-side; we only need to surface it locally for the wizard's
    // remaining steps to reference.
    const existingComplexes = await this.complexRepo.getAll();
    return existingComplexes.find(c => c.id === result.complexId) ?? null;
  }

  private async ensureOnboardingTournament(
    organizationId: string,
    organizationName: string,
    complex: Complex | null,
    venueName: string,
    enabledSportIds: string[],
    tournamentName: string,
    tournamentStartDate: string,
    tournamentEndDate: string
  ): Promise<void> {
    const normalizedName = tournamentName.trim();
    if (normalizedName.length === 0) {
      return;
    }

    const key = this.buildEntityKey(normalizedName);
    const existingKeys = await this.tournamentRepo.getExistingKeys();

    if (existingKeys.includes(key)) {
      return;
    }

    // Use the primary sport (first selection) when multiple sports were chosen.
    const primarySportId = enabledSportIds[0];
    const selectedSport = primarySportId
      ? this.availableSports().find(s => s.id === primarySportId)
      : undefined;
    const complexName = (complex?.name ?? venueName.trim()) || normalizedName;
    const complexId = complex?.id ?? 'complex_onboarding';

    await this.tournamentRepo.create({
      organizationId,
      organizationName,
      name: normalizedName,
      key,
      complexId,
      complexName,
      categoryId: 'category_open',
      categoryName: 'Open',
      genderId: 'gender_open',
      genderLabel: 'Open',
      tournamentTypeId: 'type_standard',
      tournamentTypeName: 'Standard',
      sportId: selectedSport?.id ?? enabledSportIds[0] ?? 'sport_default',
      sportName: selectedSport?.name ?? 'Sport',
      statusId: 'upcoming',
      statusLabel: 'upcoming',
      startDate: tournamentStartDate,
      endDate: tournamentEndDate,
      registrationStartDate: tournamentStartDate,
      registrationEndDate: tournamentStartDate,
      maxPairs: null,
      description: '',
      rules: '',
      isActive: true,
      selectedCourtIds: []
    });
  }

  private buildEntityKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
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

  removeCourt(index: number): void {
    const arr = this.courtNamesArray;
    if (arr.length > 1) {
      arr.removeAt(index);
      this.venueForm.get('courtsCount')!.setValue(arr.length, { emitEvent: false });
      this.courtRowsCount.set(arr.length);
    }
  }
}
