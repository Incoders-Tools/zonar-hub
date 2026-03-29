import { Injectable, signal, computed } from '@angular/core';

export type AppTheme = 'court-energy' | 'clay-match' | 'night-arena';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeState = signal<AppTheme>('court-energy');

  readonly theme = this.themeState.asReadonly();

  readonly themes: readonly AppTheme[] = ['court-energy', 'clay-match', 'night-arena'];

  readonly isDark = computed(() => this.themeState() === 'night-arena');

  setTheme(theme: AppTheme): void {
    this.themeState.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
