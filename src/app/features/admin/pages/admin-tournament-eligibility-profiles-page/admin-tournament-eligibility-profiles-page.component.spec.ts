import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentEligibilityProfilesPageComponent } from './admin-tournament-eligibility-profiles-page.component';
import { TournamentEligibilityProfilesFacadeService } from './tournament-eligibility-profiles-facade.service';
import { MockTournamentEligibilityProfileRepository } from '../../../../core/repositories/mock/mock-tournament-eligibility-profile.repository';

describe('AdminTournamentEligibilityProfilesPageComponent', () => {
  let component: AdminTournamentEligibilityProfilesPageComponent;
  let fixture: ComponentFixture<AdminTournamentEligibilityProfilesPageComponent>;
  let facade: TournamentEligibilityProfilesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentEligibilityProfilesPageComponent],
      providers: [TournamentEligibilityProfilesFacadeService, MockTournamentEligibilityProfileRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentEligibilityProfilesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentEligibilityProfilesFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load profiles on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormDialog()).toBe(true);
    expect(component.editingProfile()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormDialog.set(true);
    component.closeFormDialog();
    expect(component.showFormDialog()).toBe(false);
    expect(component.editingProfile()).toBeNull();
  });
});
