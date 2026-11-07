import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { buildEightPairKnockoutDraw } from '../../../../core/models/tournament-draw.testing';
import { PublicDrawPageComponent } from './public-draw-page.component';

describe('PublicDrawPageComponent', () => {
  let fixture: ComponentFixture<PublicDrawPageComponent>;
  let element: HTMLElement;
  let http: HttpTestingController;

  const detailUrl = '/api/public/tournaments/open-norte-abc123';
  const drawUrl = `${detailUrl}/draw`;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const create = () => {
    fixture = TestBed.createComponent(PublicDrawPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };
  const settle = () => {
    tick();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const paramMap = convertToParamMap({ slug: 'open-norte-abc123' });
    await TestBed.configureTestingModule({
      imports: [PublicDrawPageComponent],
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
  });
  afterEach(() => http.verify());

  it('requests the tournament and its published draw by the public slug, showing the loading state', fakeAsync(() => {
    create();

    expect(element.querySelector('app-loading-state')).not.toBeNull();
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(drawUrl).flush({ code: 'public_draws.not_found' }, { status: 404, statusText: 'Not Found' });
    settle();
    fixture.destroy();
  }));

  it('renders the API draw with the shared bracket view and links back to the public detail', fakeAsync(() => {
    create();
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(drawUrl).flush(buildEightPairKnockoutDraw());
    settle();

    expect(text('h1')).toBe('Cuadro del torneo');
    expect(text('.public-draw__subtitle')).toBe('Open Norte');
    expect(element.querySelector('a.public-draw__back')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
    expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
    expect(element.querySelector('app-loading-state')).toBeNull();
    fixture.destroy();
  }));

  it('shows the not-published state when the tournament has no published draw', fakeAsync(() => {
    create();
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(drawUrl).flush({ code: 'public_draws.not_found' }, { status: 404, statusText: 'Not Found' });
    settle();

    expect(element.querySelector('app-tournament-bracket')).toBeNull();
    expect(text('.public-draw__empty')).toContain('El cuadro aún no fue publicado');
    fixture.destroy();
  }));

  it('keeps the draw live with the same 30-second refresh as the tournament page', fakeAsync(() => {
    create();
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(drawUrl).flush(buildEightPairKnockoutDraw());
    settle();

    tick(30_000);
    http.expectOne(drawUrl).flush(buildEightPairKnockoutDraw());
    settle();

    expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
    fixture.destroy();
  }));

  it('shows the error state with a retry when the draw cannot be loaded', fakeAsync(() => {
    create();
    http.expectOne(detailUrl).flush(buildPublicTournament());
    http.expectOne(drawUrl).flush(null, { status: 500, statusText: 'Server Error' });
    settle();

    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    http.expectOne(drawUrl).flush(buildEightPairKnockoutDraw());
    settle();

    expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
    fixture.destroy();
  }));
});
