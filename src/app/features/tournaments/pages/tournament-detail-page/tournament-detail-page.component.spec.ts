import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentDetailPageComponent } from './tournament-detail-page.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TournamentDetailPageComponent', () => {
  let component: TournamentDetailPageComponent;
  let fixture: ComponentFixture<TournamentDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentDetailPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBeTrue();
  });

  it('should default to bracket tab', () => {
    expect(component.activeTab()).toBe('bracket');
  });
});
