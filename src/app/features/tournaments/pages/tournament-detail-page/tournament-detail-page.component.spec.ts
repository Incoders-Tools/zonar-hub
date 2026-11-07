import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { TournamentDetailPageComponent } from './tournament-detail-page.component';

describe('TournamentDetailPageComponent', () => {
  let fixture: ComponentFixture<TournamentDetailPageComponent>;
  let component: TournamentDetailPageComponent;
  let element: HTMLElement;
  let http: HttpTestingController;

  const slug = 'open-norte-abc123';
  const detailUrl = `/api/public/tournaments/${slug}`;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const settle = async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const paramMap = convertToParamMap({ slug });
    await TestBed.configureTestingModule({
      imports: [TournamentDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap }, paramMap: of(paramMap) } }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(TournamentDetailPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('shows the loading state while the tournament is requested by its slug', () => {
    expect(element.querySelector('app-loading-state')).not.toBeNull();
    http.expectOne(detailUrl).flush(buildPublicTournament());
  });

  it('renders the tournament information loaded from the public endpoint', async () => {
    http.expectNone(req => req.url.includes('/admin/'));
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await settle();

    expect(text('h1')).toBe('Open Norte');
    expect(text('.tournament-detail__status')).toBe('Inscripción abierta');
    expect(element.querySelector<HTMLImageElement>('app-sport-icon img')?.getAttribute('src')).toBe('uploads/sports-icons/padel.svg');
    expect(text('.tournament-detail__info')).toContain('Complejo Norte');
    expect(text('.tournament-detail__info')).toContain('Cuarta categoría');
    expect(text('.tournament-detail__info')).toContain('Parejas');
    expect(text('.tournament-detail__description')).toContain('Torneo abierto de la zona norte');
  });

  it('shows the full organization block with its description and links', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await settle();

    expect(element.querySelector('app-public-organization-card')).not.toBeNull();
    expect(text('.public-organization__description')).toBe('Club de pádel de la zona norte');
    expect(element.querySelector('a[data-link="whatsapp"]')?.getAttribute('href')).toBe('https://wa.me/5491122334455');
  });

  it('renders no organization block when the organization is not public', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament({ organization: null }));
    await settle();

    expect(element.querySelector('app-public-organization-card')).toBeNull();
  });

  it('shows the coming-soon state where the draw and live results will be published', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await settle();

    expect(component.activeTab()).toBe('bracket');
    expect(element.querySelector('app-tournament-bracket')).toBeNull();
    expect(text('.tournament-detail__coming-soon')).toContain('El cuadro del torneo se publicará aquí');

    element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[1].click();
    fixture.detectChanges();
    expect(text('.tournament-detail__coming-soon')).toContain('Los resultados en vivo');
  });

  it('does not offer the registration wizard, which needs internal ids the public API does not expose', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await settle();

    expect(element.querySelector('a[href$="/register"]')).toBeNull();
  });

  it('shows the translated not-found state when the API answers 404', async () => {
    http.expectOne(detailUrl).flush(
      { code: 'public_tournaments.not_found' },
      { status: 404, statusText: 'Not Found' }
    );
    await settle();

    expect(text('.tournament-detail__not-found')).toContain('Este torneo no está disponible');
    expect(element.querySelector('.tournament-detail__not-found a[href="/tournaments"]')).not.toBeNull();
    expect(element.querySelector('h1')).toBeNull();
  });

  it('shows the error state with a retry that requests the slug again', async () => {
    http.expectOne(detailUrl).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(element.querySelector('app-error-state')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    fixture.detectChanges();

    http.expectOne(detailUrl).flush(buildPublicTournament());
    await settle();
    expect(text('h1')).toBe('Open Norte');
  });
});
