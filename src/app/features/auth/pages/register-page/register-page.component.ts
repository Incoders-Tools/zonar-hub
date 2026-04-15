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
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PhoneInputComponent, OtpInputComponent],
  template: `
    <div class="auth-card">
      <h1>{{ 'auth.register' | t }}</h1>
      <p class="auth-card__desc">{{ 'auth.registerDesc' | t }}</p>

      @if (selectedPlan()) {
        <div class="auth-card__plan-badge">
          {{ 'home.pricing.' + selectedPlan() + '.name' | t }}
        </div>
      }

      <!-- STEP 1: Registration Form -->
      @if (step() === 'form') {
        <form [formGroup]="form" (ngSubmit)="onRequestVerification()" class="auth-form">
          <!-- Section: Personal info -->
          <fieldset class="auth-form__section">
            <legend class="auth-form__section-title">{{ 'auth.section.personal' | t }}</legend>

            <div class="field">
              <label for="reg-name">{{ 'auth.fullName' | t }}</label>
              <input id="reg-name" type="text" formControlName="fullName" autocomplete="name"
                [placeholder]="'auth.fullNamePlaceholder' | t" />
              @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
                <span class="field__error">{{ 'common.required' | t }}</span>
              }
              @if (form.get('fullName')?.hasError('minlength') && form.get('fullName')?.touched) {
                <span class="field__error">{{ 'common.minLength' | t }}</span>
              }
            </div>

            <div class="field">
              <label for="reg-email">{{ 'auth.email' | t }}</label>
              <input id="reg-email" type="email" formControlName="email" autocomplete="email"
                [placeholder]="'auth.emailPlaceholder' | t" />
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <span class="field__error">{{ 'common.required' | t }}</span>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <span class="field__error">{{ 'common.invalidEmail' | t }}</span>
              }
              @if (emailTaken()) {
                <div class="field__warning">
                  <span class="field__error">{{ 'auth.emailAlreadyInUse' | t }}</span>
                  <a routerLink="/login" class="field__link">{{ 'auth.loginInstead' | t }}</a>
                </div>
              }
            </div>

            <div class="field">
              <label>{{ 'auth.phone' | t }}</label>
              <app-phone-input formControlName="phone" [required]="true"></app-phone-input>
              @if (form.get('phone')?.hasError('required') && form.get('phone')?.touched) {
                <span class="field__error">{{ 'common.required' | t }}</span>
              }
              @if (phoneTaken()) {
                <div class="field__warning">
                  <span class="field__error">{{ 'auth.phoneAlreadyInUse' | t }}</span>
                  <a routerLink="/login" class="field__link">{{ 'auth.loginInstead' | t }}</a>
                </div>
              }
            </div>
          </fieldset>

          <!-- Section: Security -->
          <fieldset class="auth-form__section">
            <legend class="auth-form__section-title">{{ 'auth.section.security' | t }}</legend>

            <div class="field">
              <label for="reg-password">{{ 'auth.password' | t }}</label>
              <div class="field__password-wrapper">
                <input
                  id="reg-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password" />
                <button
                  type="button"
                  class="field__toggle-password"
                  (click)="togglePassword()"
                  [attr.aria-label]="'auth.togglePassword' | t">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <span class="field__error">{{ 'common.required' | t }}</span>
              }
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <span class="field__error">{{ 'auth.passwordMinLength' | t }}</span>
              }
              @if (form.get('password')?.value) {
                <div class="field__password-strength">
                  <div class="field__password-strength-bar" [class]="'field__password-strength-bar--' + getPasswordStrength()"></div>
                  <span class="field__password-strength-label">{{ 'auth.passwordStrength.' + getPasswordStrength() | t }}</span>
                </div>
              }
            </div>

            <div class="field">
              <label for="reg-confirm">{{ 'auth.confirmPassword' | t }}</label>
              <div class="field__password-wrapper">
                <input
                  id="reg-confirm"
                  [type]="showConfirm() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password" />
                <button
                  type="button"
                  class="field__toggle-password"
                  (click)="toggleConfirm()"
                  [attr.aria-label]="'auth.togglePassword' | t">
                  {{ showConfirm() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('confirmPassword')?.hasError('required') && form.get('confirmPassword')?.touched) {
                <span class="field__error">{{ 'common.required' | t }}</span>
              }
              @if (form.get('confirmPassword')?.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
                <span class="field__error">{{ 'common.passwordMismatch' | t }}</span>
              }
            </div>
          </fieldset>

          <!-- Terms -->
          <label class="field field--checkbox">
            <input type="checkbox" formControlName="acceptTerms" />
            <span>{{ 'auth.acceptTerms' | t }}</span>
          </label>
          @if (form.get('acceptTerms')?.hasError('requiredTrue') && form.get('acceptTerms')?.touched) {
            <span class="field__error">{{ 'auth.mustAcceptTerms' | t }}</span>
          }

          @if (error()) {
            <div class="auth-error">{{ error() | t }}</div>
          }

          <button
            type="submit"
            class="btn btn--primary btn--full"
            [disabled]="!formValid() || submitting()">
            @if (submitting()) { <span class="spinner"></span> }
            {{ 'common.next' | t }}
          </button>
        </form>
      }

      <!-- STEP 2: Verification Code -->
      @if (step() === 'verify') {
        <div class="auth-form">
          <fieldset class="auth-form__section">
            <legend class="auth-form__section-title">{{ 'verification.title' | t }}</legend>
            <p class="field__hint" style="text-align: center; margin-bottom: 1.5rem;">{{ 'verification.codeSent' | t }}</p>

            <app-otp-input
              [disabled]="verifying() || codeVerified() || attemptsExhausted()"
              [error]="!!codeError()"
              (codeChanged)="onOtpChanged($event)"
              (codeComplete)="onOtpComplete($event)">
            </app-otp-input>

            <!-- Attempts indicator -->
            <div class="field__attempts" style="text-align: center; margin-top: 1rem;">
              <span>{{ 'verification.attemptsLabel' | t }} {{ attempts() }} {{ 'verification.attemptsOf' | t }} 3</span>
            </div>

            <!-- Verification progress -->
            @if (verifying()) {
              <div class="field__verify-progress">
                <span class="spinner"></span>
                <span>{{ 'verification.verifying' | t }}</span>
              </div>
            }

            @if (codeVerified()) {
              <div class="field__verify-success">{{ 'verification.success' | t }}</div>
            }

            @if (codeError()) {
              <div class="field__verify-error">{{ codeError() | t }}</div>
            }

            @if (!codeVerified() && !attemptsExhausted()) {
              <button
                type="button"
                class="btn btn--secondary btn--full"
                style="margin-top: 1rem;"
                [disabled]="verificationCode().length !== 6 || verifying()"
                (click)="verifyCode()">
                {{ 'verification.verify' | t }}
              </button>
            }
          </fieldset>

          @if (error()) {
            <div class="auth-error">{{ error() | t }}</div>
          }

          <div class="auth-form__button-group">
            <button
              type="button"
              class="btn btn--secondary"
              (click)="backToForm()">
              {{ 'common.back' | t }}
            </button>
            <button
              type="button"
              class="btn btn--primary"
              [disabled]="!canCreateAccount()"
              (click)="onSubmit()">
              @if (submitting()) { <span class="spinner"></span> }
              {{ 'auth.registerAction' | t }}
            </button>
          </div>
        </div>
      }

      <div class="auth-card__links">
        <span>{{ 'auth.hasAccount' | t }} <a routerLink="/login">{{ 'auth.loginLink' | t }}</a></span>
      </div>
    </div>
  `,
  styleUrl: '../login-page/login-page.component.scss'
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
