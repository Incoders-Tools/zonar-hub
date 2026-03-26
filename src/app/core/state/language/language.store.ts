import { Injectable } from '@angular/core';
export type AppLanguage = 'en' | 'es' | 'pt';

@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly storageKey = 'app.language';
  setLanguage(language: AppLanguage): void {
    localStorage.setItem(this.storageKey, language);
    document.documentElement.setAttribute('lang', language);
  }
}
