import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ThemeService } from './core/theme/theme.service';
import { I18nService } from './core/i18n/i18n.service';
import { AppLocale } from './core/i18n/i18n.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast-container />
  `
})
export class AppComponent implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly i18n = inject(I18nService);
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.theme.setTheme(this.theme.theme());
    this.detectAndApplyLocale();
    this.title.setTitle(this.i18n.translate('common.appName'));
  }

  private detectAndApplyLocale(): void {
    const supported: AppLocale[] = ['es', 'en', 'pt'];
    const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
    const match = supported.find(l => l === browserLang);
    if (match) {
      this.i18n.setLocale(match);
    }
    document.documentElement.lang = this.i18n.locale();
  }
}
