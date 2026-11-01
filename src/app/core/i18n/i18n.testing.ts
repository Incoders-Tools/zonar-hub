import { Provider } from '@angular/core';
import { I18N_PRELOADED_DICTIONARIES } from './i18n.loader';
import { TRANSLATIONS } from './i18n.translations';

/** Test-only: makes every locale available synchronously so `setLocale` switches at once. */
export function provideEagerTranslations(): Provider {
  return { provide: I18N_PRELOADED_DICTIONARIES, useValue: TRANSLATIONS };
}
