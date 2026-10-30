import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { ConfirmedPairsPageComponent } from './confirmed-pairs-page.component';

describe('ConfirmedPairsPageComponent', () => {
  let component: ConfirmedPairsPageComponent;
  let fixture: ComponentFixture<ConfirmedPairsPageComponent>;
  let http: HttpTestingController;

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
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ConfirmedPairsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('should start with empty pairs', () => {
    http.expectOne('/api/public/tournaments/open-norte-abc123').flush(buildPublicTournament());
    expect(component.pairs().length).toBe(0);
  });

  it('should show empty state when no pairs', () => {
    http.expectOne('/api/public/tournaments/open-norte-abc123').flush(buildPublicTournament());
    const empty = fixture.nativeElement.querySelector('.empty');
    expect(empty).toBeTruthy();
  });

  it('loads the tournament by its public slug and links back to the public detail', async () => {
    http.expectOne('/api/public/tournaments/open-norte-abc123').flush(buildPublicTournament());
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.subtitle')?.textContent?.trim()).toBe('Open Norte');
    expect(element.querySelector('a.back-link')?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
  });
});
