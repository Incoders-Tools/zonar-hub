import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PublicTournament } from '../../../../core/models';
import { buildPublicTournament } from '../../../../core/models/public-tournament.testing';
import { PublicTournamentCardComponent } from './public-tournament-card.component';

describe('PublicTournamentCardComponent', () => {
  let fixture: ComponentFixture<PublicTournamentCardComponent>;
  let element: HTMLElement;

  function render(tournament: PublicTournament): void {
    fixture = TestBed.createComponent(PublicTournamentCardComponent);
    fixture.componentRef.setInput('tournament', tournament);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicTournamentCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
  });

  it('links the tournament name to its public slug route', () => {
    render(buildPublicTournament());

    const link = element.querySelector<HTMLAnchorElement>('a.public-tournament-card__title-link');
    expect(link?.textContent?.trim()).toBe('Open Norte');
    expect(link?.getAttribute('href')).toBe('/tournaments/open-norte-abc123');
  });

  it('renders the sport icon through app-sport-icon with the API icon source', () => {
    render(buildPublicTournament());

    expect(element.querySelector<HTMLImageElement>('app-sport-icon img.sport-icon--svg')?.getAttribute('src'))
      .toBe('uploads/sports-icons/padel.svg');
  });

  it('renders the localized status, dates, catalog names and complex', () => {
    render(buildPublicTournament());

    expect(text('.public-tournament-card__status')).toBe('Inscripción abierta');
    expect(text('.public-tournament-card__dates')).toContain('2099');
    const tags = Array.from(element.querySelectorAll('.public-tournament-card__tag')).map(tag => tag.textContent?.trim());
    expect(tags).toEqual(['Cuarta categoría', 'Mixto', 'Parejas']);
    expect(text('.public-tournament-card__complex')).toContain('Complejo Norte');
    expect(text('.public-tournament-card__complex')).toContain('Av. Siempre Viva 742');
  });

  it('picks the multilingual names for the active locale', () => {
    TestBed.inject(I18nService).setLocale('pt');
    render(buildPublicTournament());

    expect(text('.public-tournament-card__status')).toBe('Inscrição aberta');
    expect(Array.from(element.querySelectorAll('.public-tournament-card__tag')).map(tag => tag.textContent?.trim()))
      .toContain('Duplas');
  });

  it('shows the tournament image, falling back to the cover image', () => {
    render(buildPublicTournament({ imageUrl: null, coverImageUrl: 'https://cdn.example.com/cover.jpg' }));

    expect(element.querySelector<HTMLImageElement>('img.public-tournament-card__image')?.getAttribute('src'))
      .toBe('https://cdn.example.com/cover.jpg');
  });

  it('renders the organization block only when the API sends an organization', () => {
    render(buildPublicTournament());
    expect(element.querySelector('app-public-organization-card')).not.toBeNull();
    expect(text('.public-organization__name')).toBe('Club Norte');

    render(buildPublicTournament({ organization: null }));
    expect(element.querySelector('app-public-organization-card')).toBeNull();
  });

  it('omits the optional sections the API leaves null', () => {
    render(buildPublicTournament({
      status: null, sport: null, category: null, gender: null, modality: null, complex: null,
      imageUrl: null, coverImageUrl: null
    }));

    expect(element.querySelector('.public-tournament-card__status')).toBeNull();
    expect(element.querySelector('app-sport-icon')).toBeNull();
    expect(element.querySelectorAll('.public-tournament-card__tag').length).toBe(0);
    expect(element.querySelector('.public-tournament-card__complex')).toBeNull();
    expect(element.querySelector('img.public-tournament-card__image')).toBeNull();
  });
});
