import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentStatusesPageComponent } from './admin-tournament-statuses-page.component';
import { TournamentStatusesFacadeService } from './tournament-statuses-facade.service';
import { MockTournamentStatusRepository } from '../../../../core/repositories/mock/mock-tournament-status.repository';

describe('AdminTournamentStatusesPageComponent', () => {
  let component: AdminTournamentStatusesPageComponent;
  let fixture: ComponentFixture<AdminTournamentStatusesPageComponent>;
  let facade: TournamentStatusesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentStatusesPageComponent],
      providers: [TournamentStatusesFacadeService, MockTournamentStatusRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentStatusesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentStatusesFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statuses on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormDialog()).toBe(true);
    expect(component.editingStatus()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormDialog.set(true);
    component.closeFormDialog();
    expect(component.showFormDialog()).toBe(false);
    expect(component.editingStatus()).toBeNull();
  });
});
