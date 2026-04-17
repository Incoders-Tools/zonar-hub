import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TournamentListPageComponent } from './tournament-list-page.component';
import { provideRouter } from '@angular/router';

describe('TournamentListPageComponent', () => {
  let component: TournamentListPageComponent;
  let fixture: ComponentFixture<TournamentListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentListPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose tournaments signal', () => {
    expect(component.tournaments).toBeDefined();
  });

  it('should return status CSS class', () => {
    expect(component.getStatusClass('ts1')).toBe('status--ts1');
  });
});
