import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminTournamentsPageComponent } from './admin-tournaments-page.component';
import { TournamentsFacadeService } from './tournaments-facade.service';
import { MockTournamentAdminRepository } from '../../../../core/repositories/mock/mock-tournament-admin.repository';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockCategoryRepository } from '../../../../core/repositories/mock/mock-category.repository';
import { MockGenderRepository } from '../../../../core/repositories/mock/mock-gender.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';

describe('AdminTournamentsPageComponent', () => {
  let component: AdminTournamentsPageComponent;
  let fixture: ComponentFixture<AdminTournamentsPageComponent>;
  let facade: TournamentsFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentsPageComponent, NoopAnimationsModule],
      providers: [
        TournamentsFacadeService,
        MockTournamentAdminRepository,
        MockComplexRepository,
        MockCategoryRepository,
        MockGenderRepository,
        MockTournamentTypeRepository
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentsPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentsFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tournaments on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form panel for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingTournament()).toBeNull();
  });

  it('should close form panel', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingTournament()).toBeNull();
  });
});
