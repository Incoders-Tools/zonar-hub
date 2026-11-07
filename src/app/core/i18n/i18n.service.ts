import { Injectable, inject, signal } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { AppLocale, TranslationDictionary } from './i18n.types';
import { ES_TRANSLATIONS } from './i18n.es';
import { DEFAULT_LOCALE, I18N_LOCALE_LOADER, I18N_PRELOADED_DICTIONARIES } from './i18n.loader';

/**
 * Spanish is bundled and active from the start. Other locales load on their first
 * selection; until they arrive the current dictionary keeps rendering, and the last
 * requested locale wins when selections overlap.
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly loader = inject(I18N_LOCALE_LOADER);
  private readonly notifications = inject(NotificationService);

  private readonly dictionaries = new Map<AppLocale, TranslationDictionary>([
    [DEFAULT_LOCALE, ES_TRANSLATIONS],
    ...(Object.entries(inject(I18N_PRELOADED_DICTIONARIES)) as [AppLocale, TranslationDictionary][])
  ]);
  private readonly loads = new Map<AppLocale, Promise<TranslationDictionary>>();
  private latestRequest = 0;

  private readonly localeState = signal<AppLocale>(DEFAULT_LOCALE);
  private readonly dictionaryState = signal<TranslationDictionary>(ES_TRANSLATIONS);
  private readonly pendingLocaleState = signal<AppLocale | null>(null);
  private readonly loadErrorState = signal<AppLocale | null>(null);

  readonly locale = this.localeState.asReadonly();
  readonly dictionary = this.dictionaryState.asReadonly();
  /** Locale being loaded, or null when the requested locale is already active. */
  readonly pendingLocale = this.pendingLocaleState.asReadonly();
  /** Locale whose last load failed, or null. */
  readonly loadError = this.loadErrorState.asReadonly();

  /** Switches synchronously when the locale is available; otherwise resolves once it was applied or rejected. */
  setLocale(locale: AppLocale): Promise<void> {
    const request = ++this.latestRequest;
    const available = this.dictionaries.get(locale);

    if (available) {
      this.apply(locale, available);
      return Promise.resolve();
    }

    this.pendingLocaleState.set(locale);

    return this.load(locale).then(
      dictionary => {
        if (request === this.latestRequest) {
          this.apply(locale, dictionary);
        }
      },
      () => {
        if (request === this.latestRequest) {
          this.pendingLocaleState.set(null);
          this.loadErrorState.set(locale);
          this.notifications.error(this.translate('common.localeLoadError'));
        }
      }
    );
  }

  translate(key: string): string {
    const value = this.dictionary()[key];

    if (!value) {
      return key;
    }

    return value;
  }

  private load(locale: AppLocale): Promise<TranslationDictionary> {
    let load = this.loads.get(locale);

    if (!load) {
      load = this.loader(locale).then(
        dictionary => {
          this.dictionaries.set(locale, dictionary);
          return dictionary;
        },
        error => {
          this.loads.delete(locale);
          throw error;
        }
      );
      this.loads.set(locale, load);
    }

    return load;
  }

  private apply(locale: AppLocale, dictionary: TranslationDictionary): void {
    this.pendingLocaleState.set(null);
    this.loadErrorState.set(null);
    this.localeState.set(locale);
    this.dictionaryState.set(dictionary);
  }
}
