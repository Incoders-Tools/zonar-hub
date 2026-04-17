import { Component, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AttemptGuardService } from '../../../../core/services/security.service';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NormalizeLowercaseDirective } from '../../../../shared/directives/normalize-lowercase.directive';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ProgressBarComponent, NormalizeLowercaseDirective],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly attemptGuard = inject(AttemptGuardService);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly isBlocked = signal(false);
  readonly remainingAttempts = signal(5);
  readonly formValid = signal(false);
  readonly loginProgress = signal(0);
  readonly loginStageKey = signal('auth.progress.connecting');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.formValid.set(status === 'VALID'));
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  async onSubmit(): Promise<void> {
    if (!this.formValid() || this.submitting() || this.isBlocked()) return;
    this.form.markAllAsTouched();

    const email = this.form.value.email ?? '';

    if (this.attemptGuard.isBlocked(email)) {
      this.isBlocked.set(true);
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.loginProgress.set(0);
    this.loginStageKey.set('auth.progress.connecting');

    try {
      // Stage 1: Connecting
      await this.progressStage(20, 'auth.progress.connecting', 200);
      // Stage 2: Verifying credentials
      await this.progressStage(50, 'auth.progress.verifying', 200);

      const session = await this.auth.login({ email, password: this.form.value.password ?? '' });

      // Stage 3: Establishing session
      await this.progressStage(80, 'auth.progress.establishing', 200);
      // Stage 4: Complete
      await this.progressStage(100, 'auth.progress.complete', 150);

      this.attemptGuard.reset(email);
      this.notifications.success(this.i18n.translate('auth.loginSuccess'));

      // Check onboarding state
      this.onboarding.loadExisting(session.user.id);
      const isAdmin = session.user.role === 'admin' || session.user.role === 'system_admin';
      if (isAdmin && this.onboarding.needsWizard()) {
        this.router.navigate(['/admin/onboarding']);
      } else {
        const target = isAdmin ? '/admin' : '/player';
        this.router.navigate([target]);
      }
    } catch {
      this.attemptGuard.recordAttempt(email);
      const remaining = this.attemptGuard.getRemainingAttempts(email);
      this.remainingAttempts.set(remaining);
      if (remaining <= 0) {
        this.isBlocked.set(true);
      }
      this.error.set('auth.invalidCredentials');
    } finally {
      this.submitting.set(false);
      this.loginProgress.set(0);
    }
  }

  private progressStage(target: number, stageKey: string, durationMs: number): Promise<void> {
    this.loginStageKey.set(stageKey);
    this.loginProgress.set(target);
    return new Promise(resolve => setTimeout(resolve, durationMs));
  }
}
