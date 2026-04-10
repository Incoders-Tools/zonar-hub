import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { ParticipantSearchComponent } from '../../../../shared/components/participant-search/participant-search.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { AvailabilitySelectorComponent, AvailabilitySelection } from '../../../../shared/components/availability-selector/availability-selector.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { WizardFacadeService } from './wizard-facade.service';

@Component({
  selector: 'app-registration-wizard-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    StepperComponent,
    ParticipantSearchComponent,
    AsyncButtonComponent,
    AvailabilitySelectorComponent,
    TranslatePipe,
    FormatDatePipe,
    TutorialModalComponent
  ],
  providers: [WizardFacadeService],
  templateUrl: './registration-wizard-page.component.html',
  styleUrl: './registration-wizard-page.component.scss'
})
export class RegistrationWizardPageComponent implements OnInit {
  readonly facade = inject(WizardFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly currentStep = signal(0);
  readonly showTutorial = signal(false);
  readonly codeSent = signal(false);
  readonly codeVerified = signal(false);
  readonly availabilitySelection = signal<AvailabilitySelection | null>(null);

  readonly steps = computed<StepperStep[]>(() => {
    const step = this.currentStep();
    return [
      { labelKey: 'registration.step.participants', completed: step > 0 },
      { labelKey: 'registration.step.availability', completed: step > 1 },
      { labelKey: 'registration.step.verification', completed: step > 2 },
      { labelKey: 'registration.step.confirmation', completed: step > 3 }
    ];
  });

  readonly availabilityForm = new FormGroup({
    friday: new FormControl(false),
    saturday: new FormControl(true),
    sunday: new FormControl(true),
    preferredTime: new FormControl('morning'),
    notes: new FormControl('')
  });

  readonly verificationCode = new FormControl('');

  private registrationId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.facade.loadTournament(id);
  }

  onStepChanged(step: number): void {
    this.currentStep.set(step);
  }

  onAvailabilityChanged(selection: AvailabilitySelection): void {
    this.availabilitySelection.set(selection);
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < 3) {
      this.currentStep.set(current + 1);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 0) {
      this.currentStep.set(current - 1);
    }
  }

  async sendCode(): Promise<void> {
    try {
      await this.facade.sendVerificationCode(this.registrationId || 'mock-registration');
      this.codeSent.set(true);
      this.notifications.success('registration.codeSent');
    } catch {
      this.notifications.error('registration.errorSubmit');
    }
  }

  async verifyCode(): Promise<void> {
    const code = this.verificationCode.value ?? '';
    try {
      const valid = await this.facade.verifyCode(this.registrationId || 'mock-registration', code);
      if (valid) {
        this.codeVerified.set(true);
        this.notifications.success('registration.codeVerified');
      } else {
        this.notifications.error('registration.codeInvalid');
      }
    } catch {
      this.notifications.error('registration.codeInvalid');
    }
  }

  async submitRegistration(): Promise<void> {
    const t = this.facade.tournament();
    if (!t) return;

    try {
      const availability = {
        friday: this.availabilityForm.value.friday ?? false,
        saturday: this.availabilityForm.value.saturday ?? true,
        sunday: this.availabilityForm.value.sunday ?? true,
        preferredTime: this.availabilityForm.value.preferredTime ?? 'morning',
        notes: this.availabilityForm.value.notes ?? ''
      };

      const reg = await this.facade.submitRegistration(availability);
      this.registrationId = reg.id;
      this.notifications.success('registration.success');
      this.router.navigate(['/tournaments', t.id, 'confirmed-pairs']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'registration.errorSubmit';
      if (message === 'registration.duplicatePair') {
        this.notifications.error('registration.duplicatePair');
      } else {
        this.notifications.error('registration.errorSubmit');
      }
    }
  }
}
