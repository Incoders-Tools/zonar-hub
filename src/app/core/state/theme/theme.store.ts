import { Injectable } from '@angular/core';
export type AppTheme = 'light' | 'dark' | 'corporate';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storageKey = 'app.theme';
  setTheme(theme: AppTheme): void {
    localStorage.setItem(this.storageKey, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
