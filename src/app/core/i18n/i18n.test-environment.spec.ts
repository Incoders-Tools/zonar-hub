import { TestBed } from '@angular/core/testing';
import { provideEagerTranslations } from './i18n.testing';

// Root-level hook for the whole suite: specs switch locales synchronously, as they did
// before en/pt became lazy chunks. A spec can still provide its own loader or preloads.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideEagerTranslations()] });
});
