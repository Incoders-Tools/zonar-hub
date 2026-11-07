import { TranslationMap } from './i18n.types';
import { EN_TRANSLATIONS } from './i18n.en';
import { ES_TRANSLATIONS } from './i18n.es';
import { PT_TRANSLATIONS } from './i18n.pt';

/**
 * Eager aggregate of every locale, for specs and tooling only.
 * App code must not import it: it would put every locale back in the initial bundle.
 * The app loads `es` statically and `en`/`pt` on demand through `I18nService`.
 */
export const TRANSLATIONS: TranslationMap = {
  es: ES_TRANSLATIONS,
  en: EN_TRANSLATIONS,
  pt: PT_TRANSLATIONS
};
