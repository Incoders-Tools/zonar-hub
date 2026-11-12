import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { StepperComponent, StepperStep } from '../../../../shared/components/stepper/stepper.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';
import { NormalizeNameDirective } from '../../../../shared/directives/normalize-name.directive';
import { NormalizeLowercaseDirective } from '../../../../shared/directives/normalize-lowercase.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicRegistrationSlot } from '../../../../core/models';
import { publicTournamentPath } from '../../../../core/services/public-tournament-link.service';
import { ParticipantDraft, WizardFacadeService } from './wizard-facade.service';

/** Field limits of the API player contract (`PlayerBody`) and the contact email. */
const NAME_MAX = 100;
const SHORT_FIELD_MAX = 40;
const CLUB_MAX = 120;
const EMAIL_MAX = 200;

type SlotForm = FormGroup<{ [K in keyof Omit<ParticipantDraft, 'slotNumber'>]: FormControl<string> }>;

const PARTICIPANTS_STEP = 0;
const VERIFICATION_STEP = 1;
const RESULT_STEP = 2;

/** An optional slot is either left empty or has both names. */
const namesTogether: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const first = (group.get('firstName')?.value ?? '').trim();
  const last = (group.get('lastName')?.value ?? '').trim();
  return (first === '') === (last === '') ? null : { namesTogether: true };
};

/**
 * Public registration wizard of a tournament addressed by its share slug (`/tournaments/:slug/register`, S2, D4):
 * typed participants per slot, the emailed code and the public name consent, then the result. Anonymous; it reads
 * only the public API.
 */
@Component({
  selector: 'app-registration-wizard-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    StepperComponent,
    AsyncButtonComponent,
    OtpInputComponent,
    DateInputComponent,
    PhoneInputComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    TutorialModalComponent,
    NormalizeNameDirective,
    NormalizeLowercaseDirective,
    TranslatePipe,
    FormatDatePipe
  ],
  providers: [WizardFacadeService],
  templateUrl: './registration-wizard-page.component.html',
  styleUrl: './registration-wizard-page.component.scss'
})
export class RegistrationWizardPageComponent implements OnInit {
  readonly facade = inject(WizardFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly today = new Date().toISOString().split('T')[0];
  readonly slug = signal('');
  readonly tournamentPath = computed(() => publicTournamentPath(this.slug()));
  readonly confirmedPairsPath = computed(() => `${this.tournamentPath()}/confirmed-pairs`);
  readonly currentStep = signal(PARTICIPANTS_STEP);
  readonly showTutorial = signal(false);

  readonly participants = new FormArray<SlotForm>([]);
  private readonly drafts = signal<ParticipantDraft[]>([]);
  private readonly participantsValid = signal(false);

  readonly contactEmail = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(EMAIL_MAX)]
  });
  private readonly email = signal('');
  private readonly emailValid = signal(false);
  readonly consent = new FormControl(false, { nonNullable: true });
  readonly code = signal('');

  readonly steps = computed<StepperStep[]>(() => {
    const step = this.currentStep();
    return [
      { labelKey: 'registration.step.participants', completed: step > PARTICIPANTS_STEP },
      { labelKey: 'registration.step.verification', completed: step > VERIFICATION_STEP },
      { labelKey: 'registration.step.confirmation', completed: step >= RESULT_STEP }
    ];
  });

  /** Live pre-check of the typed participants against the slot rules (D3, L8); the server decides. */
  readonly precheck = computed(() => this.facade.validate(this.drafts()));
  readonly canContinue = computed(() => this.participantsValid() && this.precheck().valid);
  readonly canSendCode = computed(() =>
    this.emailValid() && this.facade.resendIn() === 0 && !this.facade.codeSending() && !this.facade.submitting());
  /** The code only works for the address it was sent to. */
  readonly codeMatchesEmail = computed(() => this.facade.codeSentTo() !== null && this.facade.codeSentTo() === this.email());
  readonly canSubmit = computed(() =>
    this.canContinue() && this.emailValid() && this.codeMatchesEmail() && /^\d{6}$/.test(this.code())
    && !this.facade.submitting());

  readonly placesLeftText = computed(() => {
    const placesLeft = this.facade.info()?.capacity.placesLeft;
    return placesLeft == null ? null : this.i18n.translate('registration.public.placesLeft').replace('{count}', String(placesLeft));
  });
  readonly codeSentText = computed(() =>
    this.i18n.translate('registration.public.codeSentTo').replace('{email}', this.facade.codeSentTo() ?? ''));
  readonly resendInText = computed(() =>
    this.i18n.translate('registration.public.resendIn').replace('{seconds}', String(this.facade.resendIn())));
  readonly paymentText = computed(() => {
    const payment = this.facade.result()?.payment;
    if (!payment || payment.status === 'notRequired' || payment.amount === null) {
      return this.i18n.translate('registration.public.result.paymentNotRequired');
    }
    return this.i18n.translate('registration.public.result.paymentPending').replace('{amount}', this.formatAmount(payment.amount));
  });
  readonly feeText = computed(() => {
    const fee = this.facade.info()?.fee;
    return fee?.required && fee.amountPerPair != null ? this.formatAmount(fee.amountPerPair) : null;
  });

  ngOnInit(): void {
    this.slug.set(this.route.snapshot.paramMap.get('slug') ?? '');
    this.contactEmail.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncEmail());
    this.participants.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncParticipants());
    void this.load();
  }

  async load(): Promise<void> {
    await this.facade.load(this.slug());
    if (this.facade.state() === 'ready') this.buildParticipantForms();
  }

  slotForm(index: number): SlotForm {
    return this.participants.at(index);
  }

  slotErrors(slotNumber: number): string[] {
    return this.precheck().slotErrors[slotNumber] ?? [];
  }

  /** Translated requirements of a slot: gender, category with its tolerance, and age limits. */
  slotRules(slot: PublicRegistrationSlot): string[] {
    const t = (key: string) => this.i18n.translate(key);
    const rules: string[] = [];
    if (slot.genderId) {
      const name = this.facade.genders().find(g => g.id === slot.genderId)?.name ?? '';
      rules.push(t('registration.public.rules.gender').replace('{name}', name));
    }
    if (slot.categoryId) {
      const name = this.facade.categories().find(c => c.id === slot.categoryId)?.name ?? '';
      rules.push(t('registration.public.rules.category').replace('{name}', name)
        .replace('{tolerance}', String(this.facade.info()?.categoryTolerance ?? 0)));
    }
    const min = slot.minAge === null ? '' : String(slot.minAge);
    const max = slot.maxAge === null ? '' : String(slot.maxAge);
    if (min && max) rules.push(t('registration.public.rules.ageBetween').replace('{min}', min).replace('{max}', max));
    else if (min) rules.push(t('registration.public.rules.ageFrom').replace('{min}', min));
    else if (max) rules.push(t('registration.public.rules.ageTo').replace('{max}', max));
    return rules.length > 0 ? rules : [t('registration.public.rules.none')];
  }

  onStepChanged(step: number): void {
    // Once sent, the registration cannot be edited from here.
    if (this.facade.result() || this.facade.submitting() || step >= RESULT_STEP) return;
    if (step === VERIFICATION_STEP && !this.canContinue()) return;
    this.currentStep.set(step);
  }

  next(): void {
    if (this.canContinue()) this.currentStep.set(VERIFICATION_STEP);
  }

  back(): void {
    if (!this.facade.submitting()) this.currentStep.set(PARTICIPANTS_STEP);
  }

  sendCode(): void {
    if (this.canSendCode()) void this.facade.requestCode(this.email());
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    await this.facade.submit(this.email(), this.code(), this.drafts(), this.consent.value);
    if (this.facade.result()) this.currentStep.set(RESULT_STEP);
  }

  private buildParticipantForms(): void {
    this.participants.clear({ emitEvent: false });
    for (const slot of this.facade.slots()) {
      const names = slot.required ? [Validators.required, Validators.maxLength(NAME_MAX)] : [Validators.maxLength(NAME_MAX)];
      const text = (validators: ValidatorFn[] = []) => new FormControl('', { nonNullable: true, validators });
      this.participants.push(new FormGroup({
        firstName: text(names),
        lastName: text(names),
        email: text([Validators.email, Validators.maxLength(EMAIL_MAX)]),
        phone: text([Validators.maxLength(SHORT_FIELD_MAX)]),
        documentId: text([Validators.maxLength(SHORT_FIELD_MAX)]),
        birthDate: text(),
        genderId: text(),
        categoryId: text(),
        club: text([Validators.maxLength(CLUB_MAX)])
      }, { validators: slot.required ? [] : [namesTogether] }), { emitEvent: false });
    }
    this.syncParticipants();
  }

  private syncParticipants(): void {
    const slots = this.facade.slots();
    this.drafts.set(this.participants.getRawValue().map((value, i) => ({ slotNumber: slots[i].slotNumber, ...value })));
    this.participantsValid.set(this.participants.valid);
  }

  private syncEmail(): void {
    this.email.set(this.contactEmail.value.trim());
    this.emailValid.set(this.contactEmail.valid);
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 2 }).format(amount);
  }
}
