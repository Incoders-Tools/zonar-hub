import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentModalitiesPageComponent } from './admin-tournament-modalities-page.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminTournamentModalitiesPageComponent', () => {
  let component: AdminTournamentModalitiesPageComponent;
  let fixture: ComponentFixture<AdminTournamentModalitiesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentModalitiesPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentModalitiesPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
