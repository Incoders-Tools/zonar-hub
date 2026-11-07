import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { TournamentListPageComponent } from './tournament-list-page.component';

describe('TournamentListPageComponent', () => {
  let fixture: ComponentFixture<TournamentListPageComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;

  const settle = async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentListPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(TournamentListPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('shows the loading state while the public endpoint answers', () => {
    expect(element.querySelector('app-loading-state')).not.toBeNull();
    http.expectOne('/api/public/tournaments').flush({ items: [] });
  });

  it('renders the public tournaments anonymously, without calling the admin endpoint', async () => {
    http.expectNone(req => req.url.includes('/admin/'));
    http.expectOne('/api/public/tournaments').flush({
      items: [buildPublicTournament(), buildPublicTournament({ slug: 'copa-sur-x1', name: 'Copa Sur', organization: null })]
    });
    await settle();

    const cards = element.querySelectorAll('app-public-tournament-card');
    expect(cards.length).toBe(2);
    expect(element.querySelector('a[href="/tournaments/open-norte-abc123"]')?.textContent?.trim()).toBe('Open Norte');
    expect(element.querySelector('a[href="/tournaments/copa-sur-x1"]')?.textContent?.trim()).toBe('Copa Sur');
  });

  it('shows the organization block only on tournaments whose organization is public', async () => {
    http.expectOne('/api/public/tournaments').flush({
      items: [buildPublicTournament(), buildPublicTournament({ slug: 'copa-sur-x1', organization: null })]
    });
    await settle();

    const cards = Array.from(element.querySelectorAll('app-public-tournament-card'));
    expect(cards[0].querySelector('app-public-organization-card')).not.toBeNull();
    expect(cards[1].querySelector('app-public-organization-card')).toBeNull();
    const instagram = cards[0].querySelector<HTMLAnchorElement>('a[data-link="instagram"]');
    expect(instagram?.getAttribute('href')).toBe('https://www.instagram.com/clubnorte');
    expect(instagram?.getAttribute('target')).toBe('_blank');
    expect(instagram?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows the translated empty state when there are no public tournaments', async () => {
    http.expectOne('/api/public/tournaments').flush({ items: [] });
    await settle();

    expect(element.querySelector('app-public-tournament-card')).toBeNull();
    expect(element.querySelector('app-empty-state')?.textContent).toContain('Aún no hay torneos públicos');
  });

  it('shows the error state and retries the public endpoint', async () => {
    http.expectOne('/api/public/tournaments').flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    const retry = element.querySelector<HTMLButtonElement>('app-error-state button');
    expect(element.querySelector('app-error-state')?.textContent).toContain('No pudimos cargar los torneos');
    retry!.click();
    fixture.detectChanges();

    http.expectOne('/api/public/tournaments').flush({ items: [buildPublicTournament()] });
    await settle();
    expect(element.querySelector('app-error-state')).toBeNull();
    expect(element.querySelectorAll('app-public-tournament-card').length).toBe(1);
  });
});
