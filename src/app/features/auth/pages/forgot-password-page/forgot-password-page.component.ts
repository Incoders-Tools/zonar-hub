import { Component, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NormalizeLowercaseDirective } from '../../../../shared/directives/normalize-lowercase.directive';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, NormalizeLowercaseDirective],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss'
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
