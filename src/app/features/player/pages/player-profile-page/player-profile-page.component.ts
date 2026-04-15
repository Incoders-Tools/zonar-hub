import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { AppLocale } from '../../../../core/i18n/i18n.types';

type ProfileTab = 'info' | 'preferences';

@Component({
  selector: 'app-player-profile-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe, PhoneInputComponent],
  template: `
    <div class="player-profile">
      <h1>{{ 'player.profile' | t }}</h1>

      <!-- Tab navigation -->
      <nav class="player-profile__tabs" role="tablist">
        <button
          class="player-profile__tab"
          [class.player-profile__tab--active]="activeTab() === 'info'"
          role="tab"
          [attr.aria-selected]="activeTab() === 'info'"
          (click)="activeTab.set('info')">
          {{ 'player.tabs.info' | t }}
        </button>
        <button
          class="player-profile__tab"
          [class.player-profile__tab--active]="activeTab() === 'preferences'"
          role="tab"
          [attr.aria-selected]="activeTab() === 'preferences'"
          (click)="activeTab.set('preferences')">
          {{ 'player.tabs.preferences' | t }}
        </button>
      </nav>

      <!-- Info tab -->
      @if (activeTab() === 'info') {
        @if (auth.currentUser(); as user) {
          <div class="profile-card">
            <div class="field">
              <label>{{ 'auth.name' | t }}</label>
              <input type="text" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" name="fullName" />
            </div>
            <div class="field">
              <label>{{ 'auth.email' | t }}</label>
              <input type="email" [value]="user.email" disabled />
            </div>
            <div class="field">
              <label>{{ 'player.phone' | t }}</label>
              <app-phone-input [ngModel]="phone()" (ngModelChange)="phone.set($event)" name="phone"></app-phone-input>
            </div>

            <button class="btn btn--primary" (click)="save()">{{ 'common.save' | t }}</button>
          </div>
        }
      }

      <!-- Preferences tab -->
      @if (activeTab() === 'preferences') {
        <div class="profile-card profile-card--wide">
          <h2 class="profile-card__title">{{ 'preferences.title' | t }}</h2>
          <p class="profile-card__subtitle">{{ 'preferences.subtitle' | t }}</p>

          <!-- Language -->
          <div class="pref-section">
            <h3 class="pref-section__title">🌐 {{ 'preferences.language.title' | t }}</h3>
            <div class="pref-section__options">
              @for (locale of locales; track locale.value) {
                <button
                  class="pref-option"
                  [class.pref-option--active]="i18n.locale() === locale.value"
                  (click)="onLocaleChange(locale.value)">
                  {{ locale.labelKey | t }}
                </button>
              }
            </div>
          </div>

          <!-- Theme -->
          <div class="pref-section">
            <h3 class="pref-section__title">🎨 {{ 'preferences.theme.title' | t }}</h3>
            <div class="pref-section__options">
              @for (theme of themes; track theme.value) {
                <button
                  class="pref-option"
                  [class.pref-option--active]="themeService.theme() === theme.value"
                  (click)="onThemeChange(theme.value)">
                  {{ theme.labelKey | t }}
                </button>
              }
            </div>
          </div>

          <!-- Date Format -->
          <div class="pref-section">
            <h3 class="pref-section__title">📅 {{ 'preferences.dateFormat.title' | t }}</h3>
            <div class="pref-section__options">
              @for (fmt of dateFormats; track fmt.value) {
                <button
                  class="pref-option"
                  [class.pref-option--active]="dateFormat.format() === fmt.value"
                  (click)="onDateFormatChange(fmt.value)">
                  {{ fmt.example }}
                </button>
              }
            </div>
          </div>

          <button class="btn btn--ghost" (click)="resetPreferences()">
            {{ 'preferences.resetToDefaults' | t }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-profile h1 { font-size: var(--zh-font-size-2xl); font-weight: 800; margin: 0 0 var(--zh-space-md); }

    .player-profile__tabs {
      display: flex;
      gap: var(--zh-space-xs);
      margin-bottom: var(--zh-space-xl);
      border-bottom: 2px solid var(--zh-border-subtle);
    }
    .player-profile__tab {
      padding: var(--zh-space-sm) var(--zh-space-lg);
      background: transparent;
      border: none;
      font-weight: 600;
      font-size: var(--zh-font-size-sm);
      color: var(--zh-text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }
    .player-profile__tab:hover { color: var(--zh-text-primary); }
    .player-profile__tab--active {
      color: var(--zh-primary);
      border-bottom-color: var(--zh-primary);
    }

    .profile-card {
      max-width: 480px;
      background: var(--zh-surface-card);
      border: 1px solid var(--zh-border-subtle);
      border-radius: var(--zh-radius-lg);
      padding: var(--zh-space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--zh-space-md);
    }
    .profile-card--wide { max-width: 640px; }
    .profile-card__title {
      margin: 0;
      font-size: var(--zh-font-size-lg);
      font-weight: 700;
      color: var(--zh-text-primary);
    }
    .profile-card__subtitle {
      margin: 0;
      color: var(--zh-text-secondary);
      font-size: var(--zh-font-size-sm);
    }

    .field { display: flex; flex-direction: column; gap: var(--zh-space-xs); }
    .field label { font-weight: 600; font-size: var(--zh-font-size-sm); }
    .field input {
      padding: var(--zh-space-sm) var(--zh-space-md);
      border: 1px solid var(--zh-border-default);
      border-radius: var(--zh-radius-md);
      background: var(--zh-surface-bg);
      color: var(--zh-text-primary);
      font-size: var(--zh-font-size-sm);
    }
    .field input:disabled { opacity: 0.6; }

    .pref-section {
      padding: var(--zh-space-md) 0;
      border-bottom: 1px solid var(--zh-border-subtle);
    }
    .pref-section__title {
      margin: 0 0 var(--zh-space-sm);
      font-size: var(--zh-font-size-md);
      font-weight: 700;
      color: var(--zh-text-primary);
    }
    .pref-section__options {
      display: flex;
      flex-wrap: wrap;
      gap: var(--zh-space-sm);
    }
    .pref-option {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 0 var(--zh-space-lg);
      border: 2px solid var(--zh-border-default);
      border-radius: var(--zh-radius-md);
      background: transparent;
      color: var(--zh-text-primary);
      font-weight: 600;
      font-size: var(--zh-font-size-sm);
      cursor: pointer;
      transition: all 0.2s;
    }
    .pref-option:hover { border-color: var(--zh-primary); color: var(--zh-primary); }
    .pref-option--active {
      background: var(--zh-primary);
      border-color: var(--zh-primary);
      color: var(--zh-on-primary);
    }
    .pref-option--active:hover { opacity: 0.9; color: var(--zh-on-primary); }

    .btn {
      padding: var(--zh-space-sm) var(--zh-space-lg);
      border: none; border-radius: var(--zh-radius-md);
      font-weight: 600; cursor: pointer;
    }
    .btn--primary { background: var(--zh-primary); color: var(--zh-on-primary); }
    .btn--primary:hover { background: var(--zh-primary-hover); }
    .btn--ghost {
      background: transparent;
      border: 1px solid var(--zh-border-default);
      color: var(--zh-text-secondary);
    }
    .btn--ghost:hover { border-color: var(--zh-primary); color: var(--zh-primary); }
  `]
})
export class PlayerProfilePageComponent {
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly userPrefs = inject(UserPreferencesService);
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dateFormat = inject(DateFormatService);

  readonly fullName = signal(this.auth.currentUser()?.fullName ?? '');
  readonly phone = signal(this.auth.currentUser()?.phone ?? '');
  readonly activeTab = signal<ProfileTab>('info');

  readonly locales: { value: AppLocale; labelKey: string }[] = [
    { value: 'es', labelKey: 'settings.language.es' },
    { value: 'en', labelKey: 'settings.language.en' },
    { value: 'pt', labelKey: 'settings.language.pt' }
  ];

  readonly themes: { value: AppTheme; labelKey: string }[] = [
    { value: 'court-energy', labelKey: 'settings.theme.courtEnergy' },
    { value: 'clay-match', labelKey: 'settings.theme.clayMatch' },
    { value: 'night-arena', labelKey: 'settings.theme.nightArena' }
  ];

  readonly dateFormats = [
    { value: 'dd/MM/yyyy', example: '25/01/2025' },
    { value: 'MM/dd/yyyy', example: '01/25/2025' },
    { value: 'yyyy-MM-dd', example: '2025-01-25' },
    { value: 'dd-MM-yyyy', example: '25-01-2025' }
  ];

  save(): void {
    this.notifications.success('player.profileSaved');
  }

  onLocaleChange(locale: AppLocale): void {
    this.userPrefs.updateCurrentUserPrefs({ locale });
    this.userPrefs.applyEffectiveSettings();
  }

  onThemeChange(theme: AppTheme): void {
    this.userPrefs.updateCurrentUserPrefs({ theme });
    this.userPrefs.applyEffectiveSettings();
  }

  onDateFormatChange(fmt: string): void {
    this.userPrefs.updateCurrentUserPrefs({ dateFormat: fmt });
    this.userPrefs.applyEffectiveSettings();
  }

  resetPreferences(): void {
    this.userPrefs.updateCurrentUserPrefs({ locale: null, theme: null, dateFormat: null, timezone: null });
    this.userPrefs.applyEffectiveSettings();
    this.notifications.success('preferences.resetToDefaults');
  }
}
