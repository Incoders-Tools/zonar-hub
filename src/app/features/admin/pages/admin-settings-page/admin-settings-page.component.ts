import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService, AppTheme } from '../../../../core/theme/theme.service';
import { AppLocale } from '../../../../core/i18n/i18n.types';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './admin-settings-page.component.html',
  styleUrl: './admin-settings-page.component.scss'
})
export class AdminSettingsPageComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);

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

  onLocaleChange(locale: string): void {
    this.i18n.setLocale(locale as AppLocale);
  }

  onThemeChange(theme: string): void {
    this.themeService.setTheme(theme as AppTheme);
  }
}
