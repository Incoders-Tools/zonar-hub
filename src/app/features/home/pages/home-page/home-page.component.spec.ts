import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let component: HomePageComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

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
});
