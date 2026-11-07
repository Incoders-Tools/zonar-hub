import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { PublicDrawPageComponent } from './public-draw-page.component';

describe('PublicDrawPageComponent', () => {
  let component: PublicDrawPageComponent;
  let fixture: ComponentFixture<PublicDrawPageComponent>;
  let http: HttpTestingController;

  const detailUrl = '/api/public/tournaments/open-norte-abc123';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicDrawPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'open-norte-abc123' }) } } }
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PublicDrawPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('should create', () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    expect(component).toBeTruthy();
  });

  it('should have null tournament initially', () => {
    // Tournament loaded async, starts null
    expect(component.tournament()).toBeNull();
    http.expectOne(detailUrl).flush(buildPublicTournament());
  });

  it('shows the not-published state because draws are not public yet', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(component.drawResult()).toBeNull();
    expect(fixture.nativeElement.querySelector('.empty')).toBeTruthy();
  });

  it('loads the tournament by its public slug and links back to the public detail', async () => {
    http.expectOne(detailUrl).flush(buildPublicTournament());
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.subtitle')?.textContent?.trim()).toBe('Open Norte');
    expect(element.querySelector('a.back-link')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
  });
});
