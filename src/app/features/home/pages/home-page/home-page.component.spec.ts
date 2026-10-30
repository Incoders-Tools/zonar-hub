import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let component: HomePageComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero section', () => {
    const hero = element.querySelector('.hero');
    expect(hero).toBeTruthy();
  });

  it('should render the main heading', () => {
    const heading = element.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('should render the primary action link', () => {
    const link = element.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });

  it('should render the feature cards', () => {
    const cards = element.querySelectorAll('.feature-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders the padel sport card with the padel paddle drawing', () => {
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.sport-card'));
    const padelImg = cards[0].querySelector<HTMLImageElement>('img.sport-icon--svg');

    expect(padelImg?.getAttribute('src')).toBe('uploads/sports-icons/padel.svg');
  });

  it('keeps the emoji icon for the other sport cards', () => {
    const icons = Array.from(element.querySelectorAll<HTMLElement>('.sport-card .sport-icon--unicode'))
      .map(icon => icon.textContent?.trim());

    expect(icons).toEqual(['🎾', '⚽', '🏉']);
  });

  describe('upcoming tournaments showcase', () => {
    let http: HttpTestingController;
    const section = () => element.querySelector<HTMLElement>('.tournaments-section');

    const respond = async (body: object | null, options?: { status: number; statusText: string }) => {
      http.expectOne('/api/public/tournaments').flush(body, options);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();
    };

    beforeEach(() => {
      http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());

    it('shows the loading state while the public endpoint answers', async () => {
      expect(section()?.querySelector('app-loading-state')).not.toBeNull();
      await respond({ items: [] });
    });

    it('renders upcoming public tournaments anonymously, without calling the admin endpoint', async () => {
      http.expectNone(req => req.url.includes('/admin/'));
      await respond({
        items: [
          buildPublicTournament(),
          buildPublicTournament({ slug: 'ended-1', name: 'Ended', startDate: '2000-01-01', endDate: '2000-01-02' })
        ]
      });

      const cards = section()!.querySelectorAll('app-public-tournament-card');
      expect(cards.length).toBe(1);
      expect(section()!.querySelector('a[href="/tournaments/open-norte-abc123"]')?.textContent?.trim()).toBe('Open Norte');
      expect(section()!.querySelector('a.tournaments-section__view-all')?.getAttribute('href')).toBe('/tournaments');
    });

    it('limits the home showcase to six tournaments', async () => {
      const items = Array.from({ length: 8 }, (_, i) => buildPublicTournament({ slug: `t-${i}`, name: `T ${i}` }));
      await respond({ items });

      expect(section()!.querySelectorAll('app-public-tournament-card').length).toBe(6);
    });

    it('shows the organization block and its links only when the organization is public', async () => {
      await respond({ items: [buildPublicTournament(), buildPublicTournament({ slug: 'no-org', organization: null })] });

      const cards = Array.from(section()!.querySelectorAll('app-public-tournament-card'));
      expect(cards[0].querySelector('app-public-organization-card')).not.toBeNull();
      expect(cards[0].querySelector('a[data-link="email"]')?.getAttribute('href')).toBe('mailto:hola@clubnorte.example.com');
      expect(cards[1].querySelector('app-public-organization-card')).toBeNull();
    });

    it('shows the translated empty state when there are no upcoming public tournaments', async () => {
      await respond({ items: [] });

      expect(section()?.querySelector('app-empty-state')?.textContent).toContain('Aún no hay torneos públicos');
    });

    it('shows the error state with a retry that requests the public endpoint again', async () => {
      await respond(null, { status: 500, statusText: 'Server Error' });

      section()!.querySelector<HTMLButtonElement>('app-error-state button')!.click();
      fixture.detectChanges();
      await respond({ items: [buildPublicTournament()] });

      expect(section()!.querySelector('app-error-state')).toBeNull();
      expect(section()!.querySelectorAll('app-public-tournament-card').length).toBe(1);
    });
  });
});
