import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentEligibilityProfilesPageComponent } from './admin-tournament-eligibility-profiles-page.component';
import { TournamentEligibilityProfilesFacadeService } from './tournament-eligibility-profiles-facade.service';
import { MockTournamentEligibilityProfileRepository } from '../../../../core/repositories/tournament-admin.repository';
import { provideHttpClient } from '@angular/common/http';

describe('AdminTournamentEligibilityProfilesPageComponent', () => {
  let component: AdminTournamentEligibilityProfilesPageComponent;
  let fixture: ComponentFixture<AdminTournamentEligibilityProfilesPageComponent>;
  let facade: TournamentEligibilityProfilesFacadeService;
  let repository: MockTournamentEligibilityProfileRepository;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentEligibilityProfilesPageComponent],
      providers: [
        TournamentEligibilityProfilesFacadeService,
        MockTournamentEligibilityProfileRepository,
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentEligibilityProfilesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentEligibilityProfilesFacadeService);
    repository = TestBed.inject(MockTournamentEligibilityProfileRepository);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load profiles on init', async () => {
    await repository.create({
      name: 'Open Profile',
      key: 'open_profile',
      description: 'Seeded profile',
      sortOrder: 1,
      isActive: true,
      slots: []
    });

    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingProfile()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingProfile()).toBeNull();
  });
});
