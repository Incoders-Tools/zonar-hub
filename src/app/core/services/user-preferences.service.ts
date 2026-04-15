import { Injectable, inject, computed, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { ThemeService, AppTheme } from '../theme/theme.service';
import { DateFormatService } from './date-format.service';
import { AppLocale } from '../i18n/i18n.types';

/**
 * User-level preference overrides.
 * When a value is null, the system default applies.
 */
export interface UserPreferences {
  locale: AppLocale | null;
  theme: AppTheme | null;
  dateFormat: string | null;
  timezone: string | null;
  showChatbot: boolean | null;
}

/**
 * Resolved (effective) settings after merging user prefs over system defaults.
 */
export interface EffectiveSettings {
  locale: AppLocale;
  theme: AppTheme;
  dateFormat: string;
  timezone: string;
  showChatbot: boolean;
}

const USER_PREFS_KEY = 'zh_user_preferences';
const SYSTEM_DEFAULTS_KEY = 'zh_system_settings';

const FACTORY_DEFAULTS: EffectiveSettings = {
  locale: 'es',
  theme: 'court-energy' as AppTheme,
  dateFormat: 'dd/MM/yyyy',
  timezone: 'America/Argentina/Buenos_Aires',
  showChatbot: true,
};

/**
 * Centralized service for resolving the effective configuration for the current user.
 *
 * Precedence rule:
 * 1. User-configured value (profile) → prevails
 * 2. System default (admin-configured) → fallback
 * 3. Factory default → last resort
 *
 * Applies to: locale, dateFormat, timezone, theme.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly themeService = inject(ThemeService);
  private readonly dateFormatService = inject(DateFormatService);

  /** System-wide defaults (admin-configured) */
  private readonly systemDefaults = signal<EffectiveSettings>(this.loadSystemDefaults());

  /** Per-user preferences keyed by userId */
  private readonly userPrefsMap = signal<Record<string, UserPreferences>>(this.loadUserPrefs());

  /** Current user's preferences (if any) */
  readonly currentUserPrefs = computed<UserPreferences | null>(() => {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return null;
    return this.userPrefsMap()[userId] ?? null;
  });

  /** The effective configuration after merging user prefs over system defaults */
  readonly effective = computed<EffectiveSettings>(() => {
    const defaults = this.systemDefaults();
    const prefs = this.currentUserPrefs();

    return {
      locale: prefs?.locale ?? defaults.locale,
      theme: prefs?.theme ?? defaults.theme,
      dateFormat: prefs?.dateFormat ?? defaults.dateFormat,
      timezone: prefs?.timezone ?? defaults.timezone,
      showChatbot: prefs?.showChatbot ?? defaults.showChatbot,
    };
  });

  /** Apply the effective settings to the actual runtime services */
  applyEffectiveSettings(): void {
    const settings = this.effective();
    this.i18n.setLocale(settings.locale);
    this.themeService.setTheme(settings.theme);
    this.dateFormatService.setFormat(settings.dateFormat);
    // Timezone is consumed directly via effective().timezone
  }

  // ─── System defaults (admin) ───

  /** Update system-wide defaults (admin action) */
  updateSystemDefaults(partial: Partial<EffectiveSettings>): void {
    const current = this.systemDefaults();
    const next = { ...current, ...partial };
    this.systemDefaults.set(next);
    this.persistSystemDefaults(next);
  }

  getSystemDefaults(): EffectiveSettings {
    return this.systemDefaults();
  }

  // ─── User preferences ───

  /** Update preferences for the current user */
  updateCurrentUserPrefs(partial: Partial<UserPreferences>): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const all = { ...this.userPrefsMap() };
    const existing = all[userId] ?? { locale: null, theme: null, dateFormat: null, timezone: null, showChatbot: null };
    all[userId] = { ...existing, ...partial };
    this.userPrefsMap.set(all);
    this.persistUserPrefs(all);

    // Re-apply
    this.applyEffectiveSettings();
  }

  /** Clear a specific preference for the current user (revert to system default) */
  clearCurrentUserPref(key: keyof UserPreferences): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const all = { ...this.userPrefsMap() };
    const existing = all[userId];
    if (!existing) return;

    all[userId] = { ...existing, [key]: null };
    this.userPrefsMap.set(all);
    this.persistUserPrefs(all);
    this.applyEffectiveSettings();
  }

  /** Clear all preferences for the current user */
  clearAllCurrentUserPrefs(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const all = { ...this.userPrefsMap() };
    delete all[userId];
    this.userPrefsMap.set(all);
    this.persistUserPrefs(all);
    this.applyEffectiveSettings();
  }

  // ─── Persistence ───

  private persistSystemDefaults(data: EffectiveSettings): void {
    try { localStorage.setItem(SYSTEM_DEFAULTS_KEY, JSON.stringify(data)); } catch { /* */ }
  }

  private loadSystemDefaults(): EffectiveSettings {
    try {
      const raw = localStorage.getItem(SYSTEM_DEFAULTS_KEY);
      return raw ? { ...FACTORY_DEFAULTS, ...JSON.parse(raw) } : { ...FACTORY_DEFAULTS };
    } catch {
      return { ...FACTORY_DEFAULTS };
    }
  }

  private persistUserPrefs(data: Record<string, UserPreferences>): void {
    try { localStorage.setItem(USER_PREFS_KEY, JSON.stringify(data)); } catch { /* */ }
  }

  private loadUserPrefs(): Record<string, UserPreferences> {
    try {
      const raw = localStorage.getItem(USER_PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
