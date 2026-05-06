import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { ThemeService, AppTheme } from '../theme/theme.service';
import { DateFormatService } from './date-format.service';
import { AppLocale } from '../i18n/i18n.types';
import { ApiSystemSettingRepository } from '../repositories/api/api-system-setting.repository';

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

const REMOTE_SETTING_KEYS = {
  locale: 'preferences.locale',
  theme: 'preferences.theme',
  dateFormat: 'preferences.date_format',
  timezone: 'preferences.timezone'
} as const;

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
  private readonly settingsRepository = inject(ApiSystemSettingRepository);
  private lastHydrationIdentity: string | null = null;

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

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.lastHydrationIdentity = null;
        return;
      }

      const identity = `${user.id}:${user.tenantId ?? ''}`;
      if (identity === this.lastHydrationIdentity) {
        return;
      }

      this.lastHydrationIdentity = identity;
      void this.hydrateFromRemote(user.id, user.tenantId);
    });
  }

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
    void this.upsertSystemDefaultsRemote(next);
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
    void this.upsertCurrentUserPrefsRemote(userId, all[userId]);
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
    void this.clearCurrentUserPrefRemote(userId, key);
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
    void this.clearAllCurrentUserPrefsRemote(userId);
  }

  private async hydrateFromRemote(userId: string, tenantId?: string): Promise<void> {
    try {
      const [
        tenantLocale,
        tenantTheme,
        tenantDateFormat,
        tenantTimezone,
        userLocale,
        userTheme,
        userDateFormat,
        userTimezone
      ] = await Promise.all([
        tenantId ? this.settingsRepository.getTenantSetting(REMOTE_SETTING_KEYS.locale, tenantId) : Promise.resolve(null),
        tenantId ? this.settingsRepository.getTenantSetting(REMOTE_SETTING_KEYS.theme, tenantId) : Promise.resolve(null),
        tenantId ? this.settingsRepository.getTenantSetting(REMOTE_SETTING_KEYS.dateFormat, tenantId) : Promise.resolve(null),
        tenantId ? this.settingsRepository.getTenantSetting(REMOTE_SETTING_KEYS.timezone, tenantId) : Promise.resolve(null),
        this.settingsRepository.getUserSetting(REMOTE_SETTING_KEYS.locale, userId, tenantId),
        this.settingsRepository.getUserSetting(REMOTE_SETTING_KEYS.theme, userId, tenantId),
        this.settingsRepository.getUserSetting(REMOTE_SETTING_KEYS.dateFormat, userId, tenantId),
        this.settingsRepository.getUserSetting(REMOTE_SETTING_KEYS.timezone, userId, tenantId)
      ]);

      const defaults = this.systemDefaults();
      const nextDefaults: EffectiveSettings = {
        ...defaults,
        locale: this.toLocale(tenantLocale) ?? defaults.locale,
        theme: this.toTheme(tenantTheme) ?? defaults.theme,
        dateFormat: tenantDateFormat ?? defaults.dateFormat,
        timezone: tenantTimezone ?? defaults.timezone
      };

      this.systemDefaults.set(nextDefaults);
      this.persistSystemDefaults(nextDefaults);

      const all = { ...this.userPrefsMap() };
      const existing = all[userId] ?? {
        locale: null,
        theme: null,
        dateFormat: null,
        timezone: null,
        showChatbot: null
      };

      all[userId] = {
        ...existing,
        locale: this.toLocale(userLocale) ?? existing.locale,
        theme: this.toTheme(userTheme) ?? existing.theme,
        dateFormat: userDateFormat ?? existing.dateFormat,
        timezone: userTimezone ?? existing.timezone
      };

      this.userPrefsMap.set(all);
      this.persistUserPrefs(all);
      this.applyEffectiveSettings();
    } catch {
      // Keep local behavior if backend preference sync is unavailable.
    }
  }

  private async upsertSystemDefaultsRemote(next: EffectiveSettings): Promise<void> {
    const tenantId = this.auth.currentUser()?.tenantId;
    if (!tenantId) return;

    try {
      await Promise.all([
        this.settingsRepository.upsertTenantSetting(REMOTE_SETTING_KEYS.locale, next.locale, tenantId),
        this.settingsRepository.upsertTenantSetting(REMOTE_SETTING_KEYS.theme, next.theme, tenantId),
        this.settingsRepository.upsertTenantSetting(REMOTE_SETTING_KEYS.dateFormat, next.dateFormat, tenantId),
        this.settingsRepository.upsertTenantSetting(REMOTE_SETTING_KEYS.timezone, next.timezone, tenantId)
      ]);
    } catch {
      // Keep local behavior if backend preference sync is unavailable.
    }
  }

  private async upsertCurrentUserPrefsRemote(userId: string, prefs: UserPreferences): Promise<void> {
    const tenantId = this.auth.currentUser()?.tenantId;
    const tasks: Promise<void>[] = [];

    if (prefs.locale) {
      tasks.push(this.settingsRepository.upsertUserSetting(REMOTE_SETTING_KEYS.locale, prefs.locale, userId, tenantId));
    }
    if (prefs.theme) {
      tasks.push(this.settingsRepository.upsertUserSetting(REMOTE_SETTING_KEYS.theme, prefs.theme, userId, tenantId));
    }
    if (prefs.dateFormat) {
      tasks.push(this.settingsRepository.upsertUserSetting(REMOTE_SETTING_KEYS.dateFormat, prefs.dateFormat, userId, tenantId));
    }
    if (prefs.timezone) {
      tasks.push(this.settingsRepository.upsertUserSetting(REMOTE_SETTING_KEYS.timezone, prefs.timezone, userId, tenantId));
    }

    if (tasks.length === 0) {
      return;
    }

    try {
      await Promise.all(tasks);
    } catch {
      // Keep local behavior if backend preference sync is unavailable.
    }
  }

  private async clearCurrentUserPrefRemote(userId: string, key: keyof UserPreferences): Promise<void> {
    const remoteKey = this.toRemoteKey(key);
    if (!remoteKey) {
      return;
    }

    const tenantId = this.auth.currentUser()?.tenantId;
    try {
      await this.settingsRepository.deleteUserSetting(remoteKey, userId, tenantId);
    } catch {
      // Keep local behavior if backend preference sync is unavailable.
    }
  }

  private async clearAllCurrentUserPrefsRemote(userId: string): Promise<void> {
    const tenantId = this.auth.currentUser()?.tenantId;
    try {
      await Promise.all([
        this.settingsRepository.deleteUserSetting(REMOTE_SETTING_KEYS.locale, userId, tenantId),
        this.settingsRepository.deleteUserSetting(REMOTE_SETTING_KEYS.theme, userId, tenantId),
        this.settingsRepository.deleteUserSetting(REMOTE_SETTING_KEYS.dateFormat, userId, tenantId),
        this.settingsRepository.deleteUserSetting(REMOTE_SETTING_KEYS.timezone, userId, tenantId)
      ]);
    } catch {
      // Keep local behavior if backend preference sync is unavailable.
    }
  }

  private toRemoteKey(key: keyof UserPreferences): string | null {
    switch (key) {
      case 'locale':
        return REMOTE_SETTING_KEYS.locale;
      case 'theme':
        return REMOTE_SETTING_KEYS.theme;
      case 'dateFormat':
        return REMOTE_SETTING_KEYS.dateFormat;
      case 'timezone':
        return REMOTE_SETTING_KEYS.timezone;
      default:
        return null;
    }
  }

  private toLocale(value: string | null): AppLocale | null {
    return value === 'es' || value === 'en' || value === 'pt' ? value : null;
  }

  private toTheme(value: string | null): AppTheme | null {
    return value === 'court-energy' || value === 'clay-match' || value === 'night-arena'
      ? value
      : null;
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
