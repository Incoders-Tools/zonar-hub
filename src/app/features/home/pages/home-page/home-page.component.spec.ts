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
});