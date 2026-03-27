export type AppLocale = 'es' | 'en' | 'pt';

export type TranslationDictionary = Record<string, string>;
export type TranslationMap = Record<AppLocale, TranslationDictionary>;