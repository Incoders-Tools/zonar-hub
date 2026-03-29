import { Component, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
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

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-card">
      <h1>{{ 'auth.register' | t }}</h1>
      <p class="auth-card__desc">{{ 'auth.registerDesc' | t }}</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="field">
          <label for="reg-name">{{ 'auth.fullName' | t }}</label>
          <input id="reg-name" type="text" formControlName="fullName" autocomplete="name" />
          @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
            <span class="field__error">{{ 'common.required' | t }}</span>
          }
          @if (form.get('fullName')?.hasError('minlength') && form.get('fullName')?.touched) {
            <span class="field__error">{{ 'common.minLength' | t }}</span>
          }
        </div>

        <div class="field">
          <label for="reg-email">{{ 'auth.email' | t }}</label>
          <input id="reg-email" type="email" formControlName="email" autocomplete="email" />
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <span class="field__error">{{ 'common.required' | t }}</span>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <span class="field__error">{{ 'common.invalidEmail' | t }}</span>
          }
        </div>

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
          {{ 'auth.registerAction' | t }}
        </button>
      </form>

      <div class="auth-card__links">
        <span>{{ 'auth.hasAccount' | t }} <a routerLink="/login">{{ 'auth.loginLink' | t }}</a></span>
      </div>
    </div>
  `,
  styleUrl: '../login-page/login-page.component.scss'
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly formValid = signal(false);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

  constructor() {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.formValid.set(status === 'VALID'));
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

  async onSubmit(): Promise<void> {
    if (!this.formValid() || this.submitting()) return;
    this.form.markAllAsTouched();

    this.submitting.set(true);
    this.error.set('');

    try {
      await this.auth.register({
        fullName: this.form.value.fullName ?? '',
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? ''
      });
      this.notifications.success(this.i18n.translate('auth.registerSuccess'));
      this.router.navigate(['/login']);
    } catch {
      this.error.set('auth.registerError');
    } finally {
      this.submitting.set(false);
    }
  }
}
