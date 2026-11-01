import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../services/notification.service';
import { I18N_LOCALE_LOADER, I18N_PRELOADED_DICTIONARIES, loadLocaleDictionary } from './i18n.loader';
import { I18nService } from './i18n.service';
import { AppLocale, TranslationDictionary } from './i18n.types';
import { EN_TRANSLATIONS } from './i18n.en';
import { ES_TRANSLATIONS } from './i18n.es';
import { PT_TRANSLATIONS } from './i18n.pt';

interface PendingLoad {
  locale: AppLocale;
  resolve: (dictionary: TranslationDictionary) => void;
  reject: (error: unknown) => void;
}

describe('I18nService', () => {
  let service: I18nService;
  let notifications: NotificationService;
  let loader: jasmine.Spy<(locale: AppLocale) => Promise<TranslationDictionary>>;
  let pending: PendingLoad[];

  const settle = () => new Promise<void>(resolve => setTimeout(resolve));

  beforeEach(() => {
    pending = [];
    loader = jasmine.createSpy('loader').and.callFake(
      (locale: AppLocale) => new Promise<TranslationDictionary>((resolve, reject) => pending.push({ locale, resolve, reject }))
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: I18N_LOCALE_LOADER, useValue: loader },
        { provide: I18N_PRELOADED_DICTIONARIES, useValue: {} }
      ]
    });

    service = TestBed.inject(I18nService);
    notifications = TestBed.inject(NotificationService);
  });

  it('starts in Spanish synchronously without loading anything', () => {
    expect(service.locale()).toBe('es');
    expect(service.translate('common.save')).toBe(ES_TRANSLATIONS['common.save']);
    expect(loader).not.toHaveBeenCalled();
  });

  it('returns the key itself when it has no translation', () => {
    expect(service.translate('missing.key')).toBe('missing.key');
  });

  it('loads English on first selection and then switches to it', async () => {
    const switched = service.setLocale('en');

    expect(loader).toHaveBeenCalledOnceWith('en');
    pending[0].resolve(EN_TRANSLATIONS);
    await switched;

    expect(service.locale()).toBe('en');
    expect(service.pendingLocale()).toBeNull();
    expect(service.translate('common.save')).toBe(EN_TRANSLATIONS['common.save']);
  });

  it('keeps rendering the current dictionary while the new locale loads', async () => {
    void service.setLocale('pt');

    expect(service.pendingLocale()).toBe('pt');
    expect(service.locale()).toBe('es');
    expect(service.translate('common.save')).toBe(ES_TRANSLATIONS['common.save']);

    pending[0].resolve(PT_TRANSLATIONS);
    await settle();

    expect(service.translate('common.save')).toBe(PT_TRANSLATIONS['common.save']);
  });

  it('applies the last requested locale when switches overlap', async () => {
    void service.setLocale('en');
    void service.setLocale('pt');
    const englishLoad = pending.find(load => load.locale === 'en')!;
    const portugueseLoad = pending.find(load => load.locale === 'pt')!;

    portugueseLoad.resolve(PT_TRANSLATIONS);
    await settle();
    englishLoad.resolve(EN_TRANSLATIONS);
    await settle();

    expect(service.locale()).toBe('pt');
    expect(service.translate('common.save')).toBe(PT_TRANSLATIONS['common.save']);
    expect(service.pendingLocale()).toBeNull();
  });

  it('does not go back to a late locale after switching to a loaded one', async () => {
    void service.setLocale('en');
    await service.setLocale('es');

    pending[0].resolve(EN_TRANSLATIONS);
    await settle();

    expect(service.locale()).toBe('es');
    expect(service.pendingLocale()).toBeNull();
    expect(service.translate('common.save')).toBe(ES_TRANSLATIONS['common.save']);
  });

  it('keeps the previous locale and shows a translated notice when loading fails', async () => {
    const switched = service.setLocale('en');
    pending[0].reject(new Error('chunk failed'));
    await switched;

    expect(service.locale()).toBe('es');
    expect(service.pendingLocale()).toBeNull();
    expect(service.loadError()).toBe('en');
    expect(service.translate('common.save')).toBe(ES_TRANSLATIONS['common.save']);
    expect(notifications.messages().map(message => [message.type, message.message])).toEqual([
      ['error', ES_TRANSLATIONS['common.localeLoadError']]
    ]);
  });

  it('retries a failed locale on the next selection and clears the error once it loads', async () => {
    const failed = service.setLocale('en');
    pending[0].reject(new Error('chunk failed'));
    await failed;

    const retried = service.setLocale('en');
    pending[1].resolve(EN_TRANSLATIONS);
    await retried;

    expect(loader).toHaveBeenCalledTimes(2);
    expect(service.locale()).toBe('en');
    expect(service.loadError()).toBeNull();
  });

  it('switches synchronously to a cached locale without loading it again', async () => {
    const first = service.setLocale('en');
    pending[0].resolve(EN_TRANSLATIONS);
    await first;
    service.setLocale('es');

    service.setLocale('en');

    expect(service.locale()).toBe('en');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('switches synchronously to preloaded dictionaries', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: I18N_LOCALE_LOADER, useValue: loader },
        { provide: I18N_PRELOADED_DICTIONARIES, useValue: { en: EN_TRANSLATIONS } }
      ]
    });
    const preloaded = TestBed.inject(I18nService);

    preloaded.setLocale('en');

    expect(preloaded.locale()).toBe('en');
    expect(preloaded.translate('common.save')).toBe(EN_TRANSLATIONS['common.save']);
    expect(loader).not.toHaveBeenCalled();
  });
});

describe('loadLocaleDictionary', () => {
  it('resolves every locale to its dictionary', async () => {
    expect(await loadLocaleDictionary('es')).toBe(ES_TRANSLATIONS);
    expect(await loadLocaleDictionary('en')).toEqual(EN_TRANSLATIONS);
    expect(await loadLocaleDictionary('pt')).toEqual(PT_TRANSLATIONS);
  });
});
