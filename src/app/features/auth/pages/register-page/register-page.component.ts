import { Component, inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TermsDialogComponent } from '../../../../shared/components/terms-dialog/terms-dialog.component';
import { NormalizeNameDirective } from '../../../../shared/directives/normalize-name.directive';
import { NormalizeLowercaseDirective } from '../../../../shared/directives/normalize-lowercase.directive';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

type RegisterStep = 'form' | 'verify';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PhoneInputComponent, OtpInputComponent, TermsDialogComponent, NormalizeNameDirective, NormalizeLowercaseDirective],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly formValid = signal(false);
  readonly selectedPlan = signal<string | null>(null);
  readonly emailTaken = signal(false);
  readonly phoneTaken = signal(false);
  readonly showTerms = signal(false);

  // Verification state
  readonly step = signal<RegisterStep>('form');
  readonly verificationCode = signal('');
  readonly verifying = signal(false);
  readonly codeVerified = signal(false);
  readonly codeError = signal('');
  readonly attempts = signal(0);
  readonly attemptsExhausted = computed(() => this.attempts() >= 3);

  readonly canCreateAccount = computed(() =>
    this.codeVerified() && !this.submitting() && !this.emailTaken() && !this.phoneTaken()
  );

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

  constructor() {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.formValid.set(status === 'VALID'));
  }

  ngOnInit(): void {
    const plan = this.route.snapshot.queryParamMap.get('plan');
    if (plan && ['starter', 'pro', 'enterprise', 'single_use', 'singleUse'].includes(plan)) {
      this.selectedPlan.set(plan === 'single_use' ? 'singleUse' : plan);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirm(): void {
    this.showConfirm.update(v => !v);
  }

  getPasswordStrength(): string {
    const pwd = this.form.get('password')?.value ?? '';
    if (pwd.length < 8) return 'weak';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 4 && pwd.length >= 12) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  acceptTermsFromDialog(): void {
    this.form.get('acceptTerms')?.setValue(true);
    this.showTerms.set(false);
  }

  /** Step 1 → validate uniqueness, then move to verification */
  async onRequestVerification(): Promise<void> {
    if (!this.formValid() || this.submitting()) return;
    this.form.markAllAsTouched();
    this.emailTaken.set(false);
    this.phoneTaken.set(false);
    this.submitting.set(true);
    this.error.set('');

    try {
      const email = this.form.value.email ?? '';
      const phone = this.form.value.phone ?? '';

      const isEmailUsed = await this.auth.checkEmailExists(email);
      if (isEmailUsed) {
        this.emailTaken.set(true);
        return;
      }
      const isPhoneUsed = await this.auth.checkPhoneExists(phone);
      if (isPhoneUsed) {
        this.phoneTaken.set(true);
        return;
      }

      // Move to verification step
      this.step.set('verify');
      this.verificationCode.set('');
      this.codeVerified.set(false);
      this.codeError.set('');
      this.attempts.set(0);
      this.notifications.info(this.i18n.translate('verification.codeSentToast'));
    } catch {
      this.error.set('auth.registerError');
    } finally {
      this.submitting.set(false);
    }
  }

  onCodeInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    this.verificationCode.set(raw);
  }

  onOtpChanged(code: string): void {
    this.verificationCode.set(code);
    this.codeError.set('');
  }

  onOtpComplete(code: string): void {
    this.verificationCode.set(code);
  }

  async verifyCode(): Promise<void> {
    if (this.verifying() || this.attemptsExhausted() || this.codeVerified()) return;

    this.verifying.set(true);
    this.codeError.set('');
    this.attempts.update(a => a + 1);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const MASTER_CODE = '451499';
    if (this.verificationCode() === MASTER_CODE) {
      this.codeVerified.set(true);
      this.notifications.success(this.i18n.translate('verification.success'));
    } else {
      if (this.attempts() >= 3) {
        this.codeError.set('verification.maxAttempts');
      } else {
        this.codeError.set('verification.invalid');
      }
    }
    this.verifying.set(false);
  }

  backToForm(): void {
    this.step.set('form');
  }

  /** Step 2 → create account after code verification */
  async onSubmit(): Promise<void> {
    if (!this.canCreateAccount() || this.submitting()) return;

    this.submitting.set(true);
    this.error.set('');

    try {
      const email = this.form.value.email ?? '';
      const phone = this.form.value.phone ?? '';

      const session = await this.auth.register({
        fullName: this.form.value.fullName ?? '',
        email,
        password: this.form.value.password ?? '',
        phone
      });

      // Init onboarding state for the new user
      this.onboarding.initForUser(session.user.id);

      this.notifications.success(this.i18n.translate('auth.registerSuccess'));

      // Redirect to onboarding wizard
      const target = session.user.role === 'admin' || session.user.role === 'system_admin'
        ? '/admin/onboarding'
        : '/player';
      this.router.navigate([target]);
    } catch {
      this.error.set('auth.registerError');
    } finally {
      this.submitting.set(false);
    }
  }
}
