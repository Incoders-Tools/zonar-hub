import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockOrganizationRepository } from '../../../../core/repositories/mock/mock-organization.repository';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (start && end && start > end) {
    return { dateRangeInvalid: true };
  }
  return null;
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
    PhoneInputComponent
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
  private readonly tournamentService = inject(TournamentService);
  private readonly subs: Subscription[] = [];

  readonly currentStep = signal(0);
  readonly saving = signal(false);

  /** Track form validity as signals so computed() reacts */
  private readonly organizationValid = signal(false);
  private readonly companyValid = signal(false);
  private readonly complexValid = signal(false);
  private readonly courtsValid = signal(true);
  private readonly sportValid = signal(true);
  private readonly tournamentValid = signal(false);

  readonly steps = computed<StepperStep[]>(() => {
    const step = this.currentStep();
    return [
      { labelKey: 'onboarding.step.organization', completed: step > 0 },
      { labelKey: 'onboarding.step.company', completed: step > 1 },
      { labelKey: 'onboarding.step.complex', completed: step > 2 },
      { labelKey: 'onboarding.step.courts', completed: step > 3 },
      { labelKey: 'onboarding.step.sport', completed: step > 4 },
      { labelKey: 'onboarding.step.tournament', completed: step > 5 }
    ];
  });

  /** Step 0: Organization */
  readonly orgForm = new FormGroup({
    displayName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl(''),
    type: new FormControl('circuito' as string, [Validators.required])
  });

  readonly orgTypeOptions = [
    { value: 'empresa', labelKey: 'organization.type.empresa' },
    { value: 'circuito', labelKey: 'organization.type.circuito' },
    { value: 'academia', labelKey: 'organization.type.academia' },
    { value: 'operadora', labelKey: 'organization.type.operadora' },
    { value: 'marca', labelKey: 'organization.type.marca' },
    { value: 'unidad_operativa', labelKey: 'organization.type.unidadOperativa' }
  ];

  /** Step 1: Company / Empresa */
  readonly companyForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)])
  });

  /** Step 1: Complex - phone from registration pre-filled */
  readonly complexForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    address: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    phone: new FormControl(this.getRegisteredPhone())
  });

  readonly courtsForm = new FormGroup({
    count: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(50)]),
    surface: new FormControl('indoor', [Validators.required])
  });

  readonly sportForm = new FormGroup({
    sports: new FormControl<string[]>(['padel'], { nonNullable: true })
  });

  readonly tournamentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    maxPairs: new FormControl(16, [Validators.required, Validators.min(4), Validators.max(128)]),
    startDate: new FormControl('', [Validators.required]),
    endDate: new FormControl('', [Validators.required])
  }, { validators: dateRangeValidator });

  readonly sportOptions = [
    { value: 'padel', labelKey: 'onboarding.sport.padel' },
    { value: 'tennis', labelKey: 'onboarding.sport.tennis' },
    { value: 'beach_tennis', labelKey: 'onboarding.sport.beachTennis' },
    { value: 'squash', labelKey: 'onboarding.sport.squash' }
  ];

  get tournamentEndDateMin(): string {
    return this.tournamentForm.get('startDate')?.value ?? '';
  }

  readonly surfaceOptions = [
    { value: 'indoor', labelKey: 'onboarding.surface.indoor' },
    { value: 'outdoor', labelKey: 'onboarding.surface.outdoor' },
    { value: 'covered', labelKey: 'onboarding.surface.covered' }
  ];

  readonly canProceed = computed(() => {
    const step = this.currentStep();
    switch (step) {
      case 0: return this.organizationValid();
      case 1: return this.companyValid();
      case 2: return this.complexValid();
      case 3: return this.courtsValid();
      case 4: return this.sportValid();
      case 5: return this.tournamentValid();
      default: return false;
    }
  });

  readonly totalSteps = 6;

  ngOnInit(): void {
    this.subs.push(
      this.orgForm.statusChanges.subscribe(() => this.organizationValid.set(this.orgForm.valid)),
      this.companyForm.statusChanges.subscribe(() => this.companyValid.set(this.companyForm.valid)),
      this.complexForm.statusChanges.subscribe(() => this.complexValid.set(this.complexForm.valid)),
      this.courtsForm.statusChanges.subscribe(() => this.courtsValid.set(this.courtsForm.valid)),
      this.sportForm.statusChanges.subscribe(() => this.sportValid.set(this.sportForm.valid && (this.sportForm.value.sports?.length ?? 0) > 0)),
      this.tournamentForm.statusChanges.subscribe(() => this.tournamentValid.set(this.tournamentForm.valid))
    );

    // Sync initial values
    this.organizationValid.set(this.orgForm.valid);
    this.companyValid.set(this.companyForm.valid);
    this.complexValid.set(this.complexForm.valid);
    this.courtsValid.set(this.courtsForm.valid);
    this.sportValid.set(this.sportForm.valid && (this.sportForm.value.sports?.length ?? 0) > 0);
    this.tournamentValid.set(this.tournamentForm.valid);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

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

  async finishSetup(): Promise<void> {
    this.saving.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      // Persist company name to tenant
      const session = this.auth.session();
      if (session?.tenant) {
        session.tenant.name = this.companyForm.value.name ?? session.tenant.name;
      }

      // Persist organization
      const orgValues = this.orgForm.value;
      await this.orgRepo.create({
        displayName: orgValues.displayName ?? '',
        description: orgValues.description ?? '',
        type: (orgValues.type ?? 'circuito') as any,
        isActive: true,
        tenantId: session?.tenant?.id ?? 'tenant-1',
        createdByUserId: session?.user?.id ?? 'u-1'
      });

      // Persist complex
      const complexValues = this.complexForm.value;
      const courtValues = this.courtsForm.value;
      const createdComplex = await this.complexRepo.create({
        name: complexValues.name ?? '',
        key: (complexValues.name ?? '').toLowerCase().replace(/\s+/g, '_'),
        address: complexValues.address ?? '',
        cityId: 'city-1',
        cityName: complexValues.city ?? '',
        phone: complexValues.phone ?? '',
        email: '',
        sortOrder: 0,
        preponderance: 0,
        sportsSupported: this.sportForm.value.sports ?? ['padel'],
        courtsCount: courtValues.count ?? 1,
        isActive: true,
        tenantId: session?.tenant?.id ?? 'tenant-1'
      } as any);

      // Persist courts
      const courtCount = courtValues.count ?? 1;
      for (let i = 1; i <= courtCount; i++) {
        await this.complexRepo.createCourt({
          complexId: createdComplex.id,
          name: `Cancha ${i}`,
          surfaceType: courtValues.surface ?? 'indoor',
          sportIds: this.sportForm.value.sports ?? ['padel'],
          isActive: true,
          isIndoor: courtValues.surface === 'indoor' || courtValues.surface === 'covered'
        });
      }

      // Persist tournament (if filled)
      const tValues = this.tournamentForm.value;
      if (tValues.name && tValues.startDate && tValues.endDate) {
        await this.tournamentService.saveTournament({
          name: tValues.name,
          maxPairs: tValues.maxPairs ?? 16,
          startDate: tValues.startDate,
          endDate: tValues.endDate,
          complexId: createdComplex.id,
          complexName: complexValues.name ?? '',
          statusLabel: 'Próximo'
        } as any);
      }

      this.onboarding.completeWizard(true);
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

  async skipTournamentStep(): Promise<void> {
    this.saving.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const session = this.auth.session();
      if (session?.tenant) {
        session.tenant.name = this.companyForm.value.name ?? session.tenant.name;
      }
      this.onboarding.completeWizard(true);
      this.notifications.success('onboarding.toast.success');
      this.router.navigate(['/admin']);
    } catch {
      this.notifications.error('onboarding.toast.error');
    } finally {
      this.saving.set(false);
    }
  }

  toggleSport(value: string): void {
    const current = this.sportForm.value.sports ?? [];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      const updated = current.filter(s => s !== value);
      this.sportForm.patchValue({ sports: updated });
    } else {
      this.sportForm.patchValue({ sports: [...current, value] });
    }
    this.sportValid.set((this.sportForm.value.sports?.length ?? 0) > 0);
  }

  isSportSelected(value: string): boolean {
    return (this.sportForm.value.sports ?? []).includes(value);
  }

  /** Pre-populate phone from registered user session */
  private getRegisteredPhone(): string {
    const user = this.auth.currentUser();
    return user?.phone ?? '';
  }
}
