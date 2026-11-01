import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { buildEightPairKnockoutDraw } from '../../../../core/models/tournament-draw.testing';
import { TournamentDraw } from '../../../../core/models/tournament-draw.model';
import { TournamentDetailPageComponent } from './tournament-detail-page.component';

describe('TournamentDetailPageComponent', () => {
  let fixture: ComponentFixture<TournamentDetailPageComponent>;
  let component: TournamentDetailPageComponent;
  let element: HTMLElement;
  let http: HttpTestingController;
  let paramMap$: BehaviorSubject<ParamMap>;
  let visibility: DocumentVisibilityState;

  const slug = 'open-norte-abc123';
  const detailUrl = `/api/public/tournaments/${slug}`;
  const drawUrl = `${detailUrl}/draw`;
  const REFRESH_MS = 30_000;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  /** Counts as an expectation, unlike `expectNone`. */
  const expectNoDrawRequest = () => expect(http.match(drawUrl).length).withContext('pending draw requests').toBe(0);
  const notFound = (code: string) => [{ code }, { status: 404, statusText: 'Not Found' }] as const;

  const settle = async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  const create = () => {
    fixture = TestBed.createComponent(TournamentDetailPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };

  const setVisibility = (state: DocumentVisibilityState) => {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
  };

  /** fakeAsync: flushes the tournament detail and lets the draw request start. */
  const loadTournament = () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    tick();
    fixture.detectChanges();
  };

  const respondDraw = (draw: TournamentDraw | null) => {
    const request = http.expectOne(drawUrl);
    if (draw) {
      request.flush(draw);
    } else {
      request.flush(...notFound('public_draws.not_found'));
    }
    tick();
    fixture.detectChanges();
  };

  const failDraw = () => {
    http.expectOne(drawUrl).flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick();
    fixture.detectChanges();
  };

  const drawWithFinalWinner = (): TournamentDraw => {
    const draw = buildEightPairKnockoutDraw();
    draw.participants[0] = { ...draw.participants[0], displayName: 'Refreshed / Pair', members: ['Ana Refreshed', 'Bea Pair'] };
    return draw;
  };

  beforeEach(async () => {
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
    paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ slug }));
    await TestBed.configureTestingModule({
      imports: [TournamentDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: paramMap$.value }, paramMap: paramMap$ } }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    delete (document as unknown as Record<string, unknown>)['visibilityState'];
  });

  describe('tournament information', () => {
    beforeEach(() => create());

    it('shows the loading state while the tournament is requested by its slug', () => {
      expect(element.querySelector('app-loading-state')).not.toBeNull();
      http.expectOne(detailUrl).flush(buildPublicTournament());
    });

    it('renders the tournament information loaded from the public endpoint', async () => {
      http.expectNone(req => req.url.includes('/admin/'));
      http.expectOne(detailUrl).flush(buildPublicTournament());
      await settle();
      http.expectOne(drawUrl).flush(...notFound('public_draws.not_found'));

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
      http.expectOne(drawUrl).flush(...notFound('public_draws.not_found'));

      expect(element.querySelector('app-public-organization-card')).not.toBeNull();
      expect(text('.public-organization__description')).toBe('Club de pádel de la zona norte');
      expect(element.querySelector('a[data-link="whatsapp"]')?.getAttribute('href')).toBe('https://wa.me/5491122334455');
    });

    it('renders no organization block when the organization is not public', async () => {
      http.expectOne(detailUrl).flush(buildPublicTournament({ organization: null }));
      await settle();
      http.expectOne(drawUrl).flush(...notFound('public_draws.not_found'));

      expect(element.querySelector('app-public-organization-card')).toBeNull();
    });

    it('does not offer the registration wizard, which needs internal ids the public API does not expose', async () => {
      http.expectOne(detailUrl).flush(buildPublicTournament());
      await settle();
      http.expectOne(drawUrl).flush(...notFound('public_draws.not_found'));

      expect(element.querySelector('a[href$="/register"]')).toBeNull();
    });

    it('shows the translated not-found state when the API answers 404 and never requests a draw', async () => {
      http.expectOne(detailUrl).flush(...notFound('public_tournaments.not_found'));
      await settle();

      expect(text('.tournament-detail__not-found')).toContain('Este torneo no está disponible');
      expect(element.querySelector('.tournament-detail__not-found a[href="/tournaments"]')).not.toBeNull();
      expect(element.querySelector('h1')).toBeNull();
      expectNoDrawRequest();
    });

    it('shows the error state with a retry that requests the slug again', async () => {
      http.expectOne(detailUrl).flush(null, { status: 500, statusText: 'Server Error' });
      await settle();

      expect(element.querySelector('app-error-state')).not.toBeNull();
      expectNoDrawRequest();
      element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
      fixture.detectChanges();

      http.expectOne(detailUrl).flush(buildPublicTournament());
      await settle();
      http.expectOne(drawUrl).flush(...notFound('public_draws.not_found'));
      expect(text('h1')).toBe('Open Norte');
    });
  });

  describe('published draw (D10)', () => {
    it('shows the shared loading state while the draw is first requested', fakeAsync(() => {
      create();
      loadTournament();

      expect(element.querySelector('.tournament-detail__content app-loading-state')).not.toBeNull();
      expect(element.querySelector('app-tournament-bracket')).toBeNull();

      respondDraw(null);
      fixture.destroy();
    }));

    it('renders the non-interactive bracket when a published draw exists', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      expect(element.querySelector('.tournament-detail__content app-loading-state')).toBeNull();
      expect(element.querySelector('.tournament-detail__coming-soon')).toBeNull();
      expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
      expect(text('app-tournament-bracket')).toContain('GÓMEZ');

      fixture.destroy();
    }));

    it('keeps the coming-soon state when the tournament has no published draw', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(null);

      expect(component.activeTab()).toBe('bracket');
      expect(element.querySelector('app-tournament-bracket')).toBeNull();
      expect(text('.tournament-detail__coming-soon')).toContain('El cuadro del torneo se publicará aquí');

      element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[1].click();
      fixture.detectChanges();
      expect(text('.tournament-detail__coming-soon')).toContain('Los resultados en vivo');

      element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[2].click();
      fixture.detectChanges();
      expect(text('.tournament-detail__coming-soon')).toContain('La lista de inscriptos confirmados');

      fixture.destroy();
    }));

    it('shows the results tab as the list view of the same draw', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[1].click();
      fixture.detectChanges();
      const modeButtons = element.querySelectorAll<HTMLButtonElement>('.draw-view__mode-btn');
      expect(modeButtons[1].getAttribute('aria-pressed')).toBe('true');

      element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[0].click();
      fixture.detectChanges();
      expect(element.querySelectorAll<HTMLButtonElement>('.draw-view__mode-btn')[0].getAttribute('aria-pressed')).toBe('true');

      element.querySelectorAll<HTMLButtonElement>('.tournament-tabs__tab')[2].click();
      fixture.detectChanges();
      expect(element.querySelector('app-tournament-bracket')).toBeNull();
      expect(text('.tournament-detail__coming-soon')).toContain('La lista de inscriptos confirmados');

      fixture.destroy();
    }));

    it('shows the initial draw error with a retry that requests the draw again', fakeAsync(() => {
      create();
      loadTournament();
      failDraw();

      expect(text('.tournament-detail__content app-error-state')).toContain('No pudimos cargar el cuadro');
      element.querySelector<HTMLButtonElement>('.tournament-detail__content app-error-state button')!.click();
      fixture.detectChanges();
      respondDraw(buildEightPairKnockoutDraw());

      expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
      fixture.destroy();
    }));

    it('shows when the draw was last updated as HH:mm in the active language', fakeAsync(() => {
      // fakeAsync freezes the clock: only `tick` moves it.
      const hhmm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());
      const firstUpdate = hhmm(new Date());

      expect(text('.public-draw-panel__updated')).toBe(`Actualizado a las ${firstUpdate}`);

      TestBed.inject(I18nService).setLocale('pt');
      fixture.detectChanges();
      expect(text('.public-draw-panel__updated')).toBe(`Atualizado às ${firstUpdate}`);

      TestBed.inject(I18nService).setLocale('en');
      // The refresh due at 30 s is answered two minutes later.
      tick(2 * 60_000);
      respondDraw(buildEightPairKnockoutDraw());
      const secondUpdate = hhmm(new Date());
      expect(secondUpdate).not.toBe(firstUpdate);
      expect(text('.public-draw-panel__updated')).toBe(`Updated at ${secondUpdate}`);

      fixture.destroy();
    }));

    it('polls every 30 seconds while the page is visible without a loading flash', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      tick(REFRESH_MS - 1);
      expectNoDrawRequest();
      tick(1);
      fixture.detectChanges();
      const refresh = http.expectOne(drawUrl);
      expect(element.querySelector('.tournament-detail__content app-loading-state')).toBeNull();
      expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
      refresh.flush(drawWithFinalWinner());
      tick();
      fixture.detectChanges();
      expect(text('app-tournament-bracket')).toContain('REFRESHED');

      tick(REFRESH_MS);
      respondDraw(drawWithFinalWinner());

      fixture.destroy();
    }));

    it('picks up a draw published after the page opened', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(null);

      tick(REFRESH_MS);
      respondDraw(buildEightPairKnockoutDraw());

      expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
      fixture.destroy();
    }));

    it('pauses while the page is hidden and refreshes on becoming visible after 30 seconds', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      tick(10_000);
      setVisibility('hidden');
      tick(5 * REFRESH_MS);
      expectNoDrawRequest();

      setVisibility('visible');
      respondDraw(buildEightPairKnockoutDraw());

      tick(REFRESH_MS - 1);
      expectNoDrawRequest();
      tick(1);
      respondDraw(buildEightPairKnockoutDraw());

      fixture.destroy();
    }));

    it('waits for the rest of the interval when the page becomes visible again before 30 seconds', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      tick(10_000);
      setVisibility('hidden');
      tick(5_000);
      setVisibility('visible');
      expectNoDrawRequest();

      tick(REFRESH_MS - 15_000 - 1);
      expectNoDrawRequest();
      tick(1);
      respondDraw(buildEightPairKnockoutDraw());

      fixture.destroy();
    }));

    it('stops polling when the page is destroyed', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      fixture.destroy();
      tick(3 * REFRESH_MS);
      setVisibility('hidden');
      setVisibility('visible');
      tick(3 * REFRESH_MS);
      expectNoDrawRequest();
      discardPeriodicTasks();
    }));

    it('ignores a draw response for the previous slug after the slug changes', fakeAsync(() => {
      create();
      loadTournament();
      const staleDraw = http.expectOne(drawUrl);

      paramMap$.next(convertToParamMap({ slug: 'copa-sur' }));
      fixture.detectChanges();
      staleDraw.flush(buildEightPairKnockoutDraw());
      tick();
      fixture.detectChanges();
      expect(element.querySelector('app-tournament-bracket')).toBeNull();

      http.expectOne('/api/public/tournaments/copa-sur').flush(buildPublicTournament({ slug: 'copa-sur', name: 'Copa Sur' }));
      tick();
      fixture.detectChanges();
      http.expectOne('/api/public/tournaments/copa-sur/draw').flush(...notFound('public_draws.not_found'));
      tick();
      fixture.detectChanges();

      expect(text('h1')).toBe('Copa Sur');
      expect(element.querySelector('app-tournament-bracket')).toBeNull();
      expect(text('.tournament-detail__coming-soon')).toContain('El cuadro del torneo se publicará aquí');

      tick(REFRESH_MS);
      expectNoDrawRequest();
      http.expectOne('/api/public/tournaments/copa-sur/draw').flush(...notFound('public_draws.not_found'));
      tick();
      fixture.destroy();
      flush();
    }));

    it('keeps the last draw on a refresh error and shows a discreet note with a retry', fakeAsync(() => {
      create();
      loadTournament();
      respondDraw(buildEightPairKnockoutDraw());

      tick(REFRESH_MS);
      failDraw();

      expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
      expect(element.querySelector('.tournament-detail__content app-error-state')).toBeNull();
      expect(element.querySelector('.tournament-detail__content app-loading-state')).toBeNull();
      expect(text('.public-draw-panel__refresh-error')).toContain('No pudimos actualizar el cuadro');

      element.querySelector<HTMLButtonElement>('.public-draw-panel__retry')!.click();
      fixture.detectChanges();
      expect(element.querySelector('.tournament-detail__content app-loading-state')).toBeNull();
      respondDraw(drawWithFinalWinner());

      expect(element.querySelector('.public-draw-panel__refresh-error')).toBeNull();
      expect(text('app-tournament-bracket')).toContain('REFRESHED');

      tick(REFRESH_MS);
      respondDraw(drawWithFinalWinner());
      fixture.destroy();
    }));
  });
});
