import { Component, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="auth-card">
      <h1>{{ 'auth.forgotPassword' | t }}</h1>
      <p class="auth-card__desc">{{ 'auth.forgotPasswordDesc' | t }}</p>

      @if (!sent()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label for="forgot-email">{{ 'auth.email' | t }}</label>
            <input id="forgot-email" type="email" formControlName="email" autocomplete="email" />
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <span class="field__error">{{ 'common.required' | t }}</span>
            }
            @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
              <span class="field__error">{{ 'common.invalidEmail' | t }}</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn--primary btn--full"
            [disabled]="!formValid() || submitting()">
            @if (submitting()) { <span class="spinner"></span> }
            {{ 'auth.sendResetLink' | t }}
          </button>
        </form>
      } @else {
        <div class="success-msg">{{ 'auth.resetLinkSent' | t }}</div>
      }

      <div class="auth-card__links">
        <a routerLink="/login">{{ 'auth.backToLogin' | t }}</a>
      </div>
    </div>
  `,
  styleUrl: '../login-page/login-page.component.scss'
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly formValid = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor() {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.formValid.set(status === 'VALID'));
  }

  async onSubmit(): Promise<void> {
    if (!this.formValid() || this.submitting()) return;
    this.form.markAllAsTouched();

    this.submitting.set(true);
    try {
      await this.auth.forgotPassword(this.form.value.email ?? '');
      this.sent.set(true);
      this.notifications.success(this.i18n.translate('auth.resetLinkSent'));
    } finally {
      this.submitting.set(false);
    }
  }
}
