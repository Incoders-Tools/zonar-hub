import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';

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
export class AdminOnboardingPageComponent {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly onboarding = inject(OnboardingStateService);

  readonly currentStep = signal(0);
  readonly saving = signal(false);

  readonly steps = computed<StepperStep[]>(() => {
    const step = this.currentStep();
    return [
      { labelKey: 'onboarding.step.complex', completed: step > 0 },
      { labelKey: 'onboarding.step.courts', completed: step > 1 },
      { labelKey: 'onboarding.step.sport', completed: step > 2 },
      { labelKey: 'onboarding.step.tournament', completed: step > 3 }
    ];
  });

  readonly complexForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    address: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    phone: new FormControl('')
  });

  readonly courtsForm = new FormGroup({
    count: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(50)]),
    surface: new FormControl('indoor', [Validators.required])
  });

  readonly sportForm = new FormGroup({
    sport: new FormControl('padel', [Validators.required])
  });

  readonly tournamentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    maxPairs: new FormControl(16, [Validators.required, Validators.min(4), Validators.max(128)]),
    startDate: new FormControl('', [Validators.required]),
    endDate: new FormControl('', [Validators.required])
  });

  readonly sportOptions = [
    { value: 'padel', labelKey: 'onboarding.sport.padel' },
    { value: 'tennis', labelKey: 'onboarding.sport.tennis' },
    { value: 'beach_tennis', labelKey: 'onboarding.sport.beachTennis' },
    { value: 'squash', labelKey: 'onboarding.sport.squash' }
  ];

  readonly surfaceOptions = [
    { value: 'indoor', labelKey: 'onboarding.surface.indoor' },
    { value: 'outdoor', labelKey: 'onboarding.surface.outdoor' },
    { value: 'covered', labelKey: 'onboarding.surface.covered' }
  ];

  readonly canProceed = computed(() => {
    const step = this.currentStep();
    switch (step) {
      case 0: return this.complexForm.valid;
      case 1: return this.courtsForm.valid;
      case 2: return this.sportForm.valid;
      case 3: return this.tournamentForm.valid;
      default: return false;
    }
  });

  nextStep(): void {
    const current = this.currentStep();
    if (current < 3) {
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
      await new Promise(resolve => setTimeout(resolve, 1200));
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
}
