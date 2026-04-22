import { Component, inject, OnInit, signal, computed, ViewChildren, QueryList, ElementRef } from '@angular/core';
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

  /** Master verification code (temporary) */
  private readonly MASTER_CODE = '451499';

  /** OTP digit controls (6 digits) */
  readonly otpDigits = Array.from({ length: 6 }, () => new FormControl(''));

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  /** Reactive OTP value — updated manually on every digit change since FormControl.value is not a Signal */
  readonly otpValue = signal('');

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

  /** @deprecated kept for potential backward compat */
  readonly verificationCode = new FormControl('');

  private registrationId = '';

  /** Called when a digit is typed in an OTP box */
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index].setValue(val);
    input.value = val;
    this.otpValue.set(this.otpDigits.map(c => c.value ?? '').join(''));
    if (val && index < 5) {
      const next = this.otpInputs.toArray()[index + 1];
      next?.nativeElement.focus();
    }
  }

  /** Handle backspace to go to previous digit */
  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index].value && index > 0) {
      const prev = this.otpInputs.toArray()[index - 1];
      prev?.nativeElement.focus();
    }
  }

  /** Handle paste into OTP field */
  onOtpPaste(event: ClipboardEvent, startIndex: number): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6 - startIndex);
    const inputs = this.otpInputs.toArray();
    pasted.split('').forEach((ch, i) => {
      const idx = startIndex + i;
      if (idx < 6) {
        this.otpDigits[idx].setValue(ch);
        if (inputs[idx]) inputs[idx].nativeElement.value = ch;
      }
    });
    const focusIdx = Math.min(startIndex + pasted.length, 5);
    inputs[focusIdx]?.nativeElement.focus();
    this.otpValue.set(this.otpDigits.map(c => c.value ?? '').join(''));
  }

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
    const code = this.otpValue();
    try {
      // Master code bypass (temporary)
      if (code === this.MASTER_CODE) {
        this.codeVerified.set(true);
        this.notifications.success('registration.codeVerified');
        return;
      }
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
