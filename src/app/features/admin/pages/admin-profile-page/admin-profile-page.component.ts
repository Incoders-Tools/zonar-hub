import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { AppLocale } from '../../../../core/i18n/i18n.types';

type ProfileTab = 'info' | 'config';

@Component({
  selector: 'app-admin-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AsyncButtonComponent,
    FormShellComponent,
    PhoneInputComponent
  ],
  templateUrl: './admin-profile-page.component.html',
  styleUrl: './admin-profile-page.component.scss'
})
export class AdminProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly prefs = inject(UserPreferencesService);
  private readonly themeService = inject(ThemeService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.auth.currentUser;
  readonly activeTab = signal<ProfileTab>('info');

  // Info tab state
  readonly savingInfo = signal(false);
  readonly infoDirty = signal(false);
  readonly infoValid = signal(false);

  // Config tab state
  readonly savingConfig = signal(false);
  readonly configDirty = signal(false);
  readonly configValid = signal(false);

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

  readonly localeOptions: { value: AppLocale; labelKey: string }[] = [
    { value: 'es', labelKey: 'admin.profile.locale.es' },
    { value: 'en', labelKey: 'admin.profile.locale.en' },
    { value: 'pt', labelKey: 'admin.profile.locale.pt' }
  ];

  readonly dateFormatOptions = [
    { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
    { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy' },
    { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd' }
  ];

  readonly themeOptions: { value: AppTheme; labelKey: string }[] = [
    { value: 'court-energy', labelKey: 'admin.profile.theme.courtEnergy' },
    { value: 'clay-match', labelKey: 'admin.profile.theme.clayMatch' },
    { value: 'night-arena', labelKey: 'admin.profile.theme.nightArena' }
  ];

  readonly timezoneOptions = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Montevideo', label: 'Montevideo (GMT-3)' },
    { value: 'America/Asuncion', label: 'Asunción (GMT-4)' },
    { value: 'America/Guayaquil', label: 'Guayaquil (GMT-5)' },
    { value: 'America/Caracas', label: 'Caracas (GMT-4)' }
  ];

  infoForm!: FormGroup;
  configForm!: FormGroup;

  readonly canSubmitInfo = computed(() => {
    return this.infoValid() && this.infoDirty() && !this.savingInfo();
  });

  readonly canSubmitConfig = computed(() => {
    return this.configValid() && this.configDirty() && !this.savingConfig();
  });

  ngOnInit(): void {
    const u = this.user();
    const effective = this.prefs.effective();

    this.infoForm = this.fb.group({
      fullName: [u?.fullName ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: [{ value: u?.email ?? '', disabled: true }],
      phone: [u?.phone ?? '']
    });

    this.configForm = this.fb.group({
      locale: [effective.locale],
      dateFormat: [effective.dateFormat],
      theme: [effective.theme],
      timezone: [effective.timezone]
    });

    merge(this.infoForm.statusChanges, this.infoForm.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.infoDirty.set(this.infoForm.dirty);
        this.infoValid.set(this.infoForm.valid);
      });

    merge(this.configForm.statusChanges, this.configForm.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.configDirty.set(this.configForm.dirty);
        this.configValid.set(this.configForm.valid);
      });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  async onSubmitInfo(): Promise<void> {
    if (!this.infoForm.valid || this.savingInfo()) return;

    this.savingInfo.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      this.notification.success('admin.profile.saveSuccess');
      this.infoForm.markAsPristine();
      this.infoDirty.set(false);
    } catch {
      this.notification.error('admin.profile.saveError');
    } finally {
      this.savingInfo.set(false);
    }
  }

  async onSubmitConfig(): Promise<void> {
    if (!this.configForm.valid || this.savingConfig()) return;

    this.savingConfig.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const values = this.configForm.getRawValue();
      this.prefs.updateCurrentUserPrefs({
        locale: values.locale,
        theme: values.theme,
        dateFormat: values.dateFormat,
        timezone: values.timezone
      });

      this.notification.success('admin.profile.config.saveSuccess');
      this.configForm.markAsPristine();
      this.configDirty.set(false);
    } catch {
      this.notification.error('admin.profile.config.saveError');
    } finally {
      this.savingConfig.set(false);
    }
  }
}
