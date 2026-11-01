import { AppLocale } from './i18n.types';
import { TRANSLATIONS } from './i18n.translations';

const LOCALES = Object.keys(TRANSLATIONS) as AppLocale[];

describe('translation parity across locales', () => {
  const sortedKeys = (locale: AppLocale) => Object.keys(TRANSLATIONS[locale]).sort();

  it('covers es, en and pt', () => {
    expect(LOCALES.sort()).toEqual(['en', 'es', 'pt']);
  });

  for (const locale of LOCALES.filter(locale => locale !== 'es')) {
    it(`gives ${locale} exactly the same keys as es`, () => {
      const spanish = new Set(sortedKeys('es'));
      const other = new Set(sortedKeys(locale));

      expect([...spanish].filter(key => !other.has(key))).withContext(`missing in ${locale}`).toEqual([]);
      expect([...other].filter(key => !spanish.has(key))).withContext(`only in ${locale}`).toEqual([]);
    });

    it(`leaves a ${locale} value empty only when the es value is empty too`, () => {
      const emptyOnlyHere = sortedKeys(locale).filter(
        key => TRANSLATIONS[locale][key].trim() === '' && TRANSLATIONS.es[key]?.trim() !== ''
      );
      const emptyOnlyInSpanish = sortedKeys('es').filter(
        key => TRANSLATIONS.es[key].trim() === '' && TRANSLATIONS[locale][key]?.trim() !== ''
      );

      expect(emptyOnlyHere).withContext(`empty only in ${locale}`).toEqual([]);
      expect(emptyOnlyInSpanish).withContext(`empty only in es, not in ${locale}`).toEqual([]);
    });
  }
});
