import { Component, inject, signal, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { DateFormatService } from '../../../../core/services/date-format.service';
import { UserPreferencesService } from '../../../../core/services/user-preferences.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { AppLocale } from '../../../../core/i18n/i18n.types';

interface TimezoneOption {
  value: string;
  label: string;
}

interface DateFormatOption {
  value: string;
  example: string;
}

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [TranslatePipe, HelpButtonComponent],
  templateUrl: './admin-settings-page.component.html',
  styleUrl: './admin-settings-page.component.scss'
})
export class AdminSettingsPageComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly dateFormatService = inject(DateFormatService);
  protected readonly userPrefs = inject(UserPreferencesService);
  private readonly notifications = inject(NotificationService);

  /** Read system defaults for button highlight (not effective/runtime values) */
  readonly systemLocale = computed(() => this.userPrefs.getSystemDefaults().locale);
  readonly systemTheme = computed(() => this.userPrefs.getSystemDefaults().theme);
  readonly systemTimezone = computed(() => this.userPrefs.getSystemDefaults().timezone);
  readonly systemDateFormat = computed(() => this.userPrefs.getSystemDefaults().dateFormat);

  /** Whether current user has personal preferences that override system defaults */
  readonly hasUserOverride = computed(() => {
    const prefs = this.userPrefs.currentUserPrefs();
    return prefs !== null && (prefs.locale !== null || prefs.theme !== null || prefs.dateFormat !== null || prefs.timezone !== null);
  });

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

  readonly timezones: TimezoneOption[] = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/Santiago', label: 'Santiago (UTC-4)' },
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
    { value: 'America/Lima', label: 'Lima (UTC-5)' },
    { value: 'America/Montevideo', label: 'Montevideo (UTC-3)' },
    { value: 'America/Caracas', label: 'Caracas (UTC-4)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' }
  ];

  readonly dateFormats: DateFormatOption[] = [
    { value: 'dd/MM/yyyy', example: '25/01/2025' },
    { value: 'MM/dd/yyyy', example: '01/25/2025' },
    { value: 'yyyy-MM-dd', example: '2025-01-25' },
    { value: 'dd-MM-yyyy', example: '25-01-2025' },
    { value: 'dd.MM.yyyy', example: '25.01.2025' }
  ];

  readonly helpSections: HelpSection[] = [
    { titleKey: 'settings.help.section1Title', contentKey: 'settings.help.section1Text' },
    { titleKey: 'settings.help.section2Title', contentKey: 'settings.help.section2Text' }
  ];

  onLocaleChange(locale: string): void {
    this.userPrefs.updateSystemDefaults({ locale: locale as AppLocale });
    this.userPrefs.applyEffectiveSettings();
    this.notifications.success('settings.saved');
  }

  onThemeChange(theme: string): void {
    this.userPrefs.updateSystemDefaults({ theme: theme as AppTheme });
    this.userPrefs.applyEffectiveSettings();
    this.notifications.success('settings.saved');
  }

  onTimezoneChange(tz: string): void {
    this.userPrefs.updateSystemDefaults({ timezone: tz });
    this.userPrefs.applyEffectiveSettings();
    this.notifications.success('settings.saved');
  }

  onDateFormatChange(fmt: string): void {
    this.userPrefs.updateSystemDefaults({ dateFormat: fmt });
    this.userPrefs.applyEffectiveSettings();
    this.notifications.success('settings.saved');
  }
}
