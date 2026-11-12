import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ES_TRANSLATIONS } from '../../../../core/i18n/i18n.es';
import { PUBLIC_REQUEST } from '../../../../core/http/public-request.context';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { ConfirmedPairsPageComponent } from './confirmed-pairs-page.component';

describe('ConfirmedPairsPageComponent', () => {
  let fixture: ComponentFixture<ConfirmedPairsPageComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;

  const detailUrl = '/api/public/tournaments/open-norte-abc123';
  const pairsUrl = `${detailUrl}/confirmed-pairs`;
  const notFound = [{ code: 'public_tournaments.not_found' }, { status: 404, statusText: 'Not Found' }] as const;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const settle = async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const respond = async (pairs: object) => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    const request = http.expectOne(pairsUrl);
    expect(request.request.context.get(PUBLIC_REQUEST)).toBeTrue();
    request.flush(pairs);
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmedPairsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'open-norte-abc123' }) } } }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ConfirmedPairsPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('shows the loading state while the pairs are requested', async () => {
    expect(element.querySelector('app-loading-state')).not.toBeNull();
    await respond({ items: [] });
  });

  it('renders consented names and the translated anonymised label in registration order', async () => {
    await respond({ items: [
      { position: 1, displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], labelKey: null },
      { position: 2, displayName: null, members: [], labelKey: 'public_registrations.confirmed_pairs.anonymous' }
    ] });

    const cards = Array.from(element.querySelectorAll('.pair-card'));
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Ana Gil');
    expect(cards[0].textContent).toContain('Bea Paz');
    expect(cards[1].querySelector('.pair-card__name')?.textContent?.trim()).toBe(ES_TRANSLATIONS['public_registrations.confirmed_pairs.anonymous']);
    expect(text('.subtitle')).toBe('Open Norte');
    expect(element.querySelector('a.back-link')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
  });

  it('shows the anonymised label when the API sends an unknown label key', async () => {
    await respond({ items: [{ position: 1, displayName: null, members: [], labelKey: 'something.unknown' }] });

    expect(text('.pair-card__name')).toBe(ES_TRANSLATIONS['public_registrations.confirmed_pairs.anonymous']);
  });

  it('shows the empty state when no pair is confirmed yet', async () => {
    await respond({ items: [] });

    expect(element.querySelector('app-empty-state')).not.toBeNull();
    expect(element.querySelector('.pair-card')).toBeNull();
  });

  it('shows the not-found state with a link to the list when the tournament is not public', async () => {
    http.expectOne(detailUrl).flush(...notFound);
    http.expectOne(pairsUrl).flush(...notFound);
    await settle();

    expect(text('.confirmed-pairs__not-found')).toContain(ES_TRANSLATIONS['publicTournaments.detail.notFound.title']);
    expect(element.querySelector('.confirmed-pairs__not-found a')?.getAttribute('href')).toBe('/tournaments');
  });

  it('shows the error state with a retry that requests the pairs again', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(pairsUrl).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    expect(element.querySelector('app-error-state')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    fixture.detectChanges();
    await respond({ items: [{ position: 1, displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], labelKey: null }] });

    expect(element.querySelectorAll('.pair-card').length).toBe(1);
  });
});
