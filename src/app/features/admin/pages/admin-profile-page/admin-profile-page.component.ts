import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AsyncButtonComponent,
    FormShellComponent
  ],
  templateUrl: './admin-profile-page.component.html',
  styleUrl: './admin-profile-page.component.scss'
})
export class AdminProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly dateFormat = inject(DateFormatService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.auth.currentUser;
  readonly saving = signal(false);
  readonly formDirty = signal(false);
  readonly formValid = signal(false);

  readonly initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || '??';
  });

  readonly roleLabelKey = computed(() => {
    const role = this.user()?.role;
    switch (role) {
      case 'system_admin': return 'admin.profile.role.systemAdmin';
      case 'admin': return 'admin.profile.role.admin';
      case 'player': return 'admin.profile.role.player';
      case 'viewer': return 'admin.profile.role.viewer';
      default: return 'admin.profile.role.unknown';
    }
  });

  readonly localeOptions = [
    { value: 'es', labelKey: 'admin.profile.locale.es' },
    { value: 'en', labelKey: 'admin.profile.locale.en' },
    { value: 'pt', labelKey: 'admin.profile.locale.pt' }
  ];

  readonly dateFormatOptions = [
    { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
    { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy' },
    { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd' }
  ];

  form!: FormGroup;

  readonly canSubmit = computed(() => {
    return this.formValid() && this.formDirty() && !this.saving();
  });

  ngOnInit(): void {
    const u = this.user();
    this.form = this.fb.group({
      fullName: [u?.fullName ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: [{ value: u?.email ?? '', disabled: true }],
      phone: [u?.phone ?? '', [Validators.maxLength(20)]],
      locale: [this.i18n.locale()],
      dateFormat: [this.dateFormat.format()]
    });

    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formDirty.set(this.form.dirty);
        this.formValid.set(this.form.valid);
      });
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || this.saving()) return;

    this.saving.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const values = this.form.getRawValue();

      this.i18n.setLocale(values.locale);
      this.dateFormat.setFormat(values.dateFormat);

      this.notification.success('admin.profile.saveSuccess');
      this.form.markAsPristine();
      this.formDirty.set(false);
    } catch {
      this.notification.error('admin.profile.saveError');
    } finally {
      this.saving.set(false);
    }
  }
}
