import { InjectionToken } from '@angular/core';
import { AppLocale, TranslationDictionary } from './i18n.types';
import { ES_TRANSLATIONS } from './i18n.es';

export const DEFAULT_LOCALE: AppLocale = 'es';

export type LocaleDictionaryLoader = (locale: AppLocale) => Promise<TranslationDictionary>;

/**
 * Loads a locale dictionary. `es` ships in the initial bundle; every other locale
 * is a separate chunk fetched with a dynamic `import()` the first time it is used.
 */
export function loadLocaleDictionary(locale: AppLocale): Promise<TranslationDictionary> {
  switch (locale) {
    case 'es':
      return Promise.resolve(ES_TRANSLATIONS);
    case 'en':
      return import('./i18n.en').then(module => module.EN_TRANSLATIONS);
    case 'pt':
      return import('./i18n.pt').then(module => module.PT_TRANSLATIONS);
  }
}

export const I18N_LOCALE_LOADER = new InjectionToken<LocaleDictionaryLoader>('I18N_LOCALE_LOADER', {
  providedIn: 'root',
  factory: () => loadLocaleDictionary
});

/** Dictionaries available synchronously besides `es` (the test environment preloads every locale). */
export const I18N_PRELOADED_DICTIONARIES = new InjectionToken<Partial<Record<AppLocale, TranslationDictionary>>>(
  'I18N_PRELOADED_DICTIONARIES',
  {
    providedIn: 'root',
    factory: () => ({})
  }
);
