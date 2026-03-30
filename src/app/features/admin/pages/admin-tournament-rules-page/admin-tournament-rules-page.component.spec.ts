import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentRulesPageComponent } from './admin-tournament-rules-page.component';
import { TournamentRulesFacadeService } from './tournament-rules-facade.service';
import { MockTournamentRuleSetRepository } from '../../../../core/repositories/mock/mock-tournament-rule-set.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('AdminTournamentRulesPageComponent', () => {
  let component: AdminTournamentRulesPageComponent;
  let fixture: ComponentFixture<AdminTournamentRulesPageComponent>;
  let facade: TournamentRulesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentRulesPageComponent],
      providers: [
        TournamentRulesFacadeService,
        MockTournamentRuleSetRepository,
        MockTournamentTypeRepository,
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentRulesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentRulesFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load rule sets on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form panel for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingRuleSet()).toBeNull();
  });

  it('should close form panel', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingRuleSet()).toBeNull();
  });

  it('should open delete confirmation', () => {
    const mockRow = { id: 'trs1', tournamentTypeName: 'Round Robin', isActive: true, statusLabel: '', createdAt: '' };
    component.confirmDelete(mockRow);
    expect(component.showDeleteDialog()).toBe(true);
    expect(component.deletingId()).toBe('trs1');
  });

  it('should cancel delete', () => {
    component.showDeleteDialog.set(true);
    component.cancelDelete();
    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });
});
