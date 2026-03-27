import { Injectable, computed, signal } from '@angular/core';
import { AppLocale } from './i18n.types';
import { TRANSLATIONS } from './i18n.translations';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly localeState = signal<AppLocale>('es');

  readonly locale = this.localeState.asReadonly();

  readonly dictionary = computed(() => TRANSLATIONS[this.localeState()]);

  setLocale(locale: AppLocale): void {
    this.localeState.set(locale);
  }

  translate(key: string): string {
    const value = this.dictionary()[key];

    if (!value) {
      return key;
    }

    return value;
  }
}