import { TestBed } from '@angular/core/testing';
import { TournamentRulesFacadeService } from './tournament-rules-facade.service';
import { MockTournamentRuleSetRepository } from '../../../../core/repositories/mock/mock-tournament-rule-set.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';

describe('TournamentRulesFacadeService', () => {
  let service: TournamentRulesFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TournamentRulesFacadeService,
        MockTournamentRuleSetRepository,
        MockTournamentTypeRepository
      ]
    });
    service = TestBed.inject(TournamentRulesFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load rule sets and tournament types', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
    expect(service.tournamentTypes().length).toBeGreaterThan(0);
  });

  it('should apply filters', () => {
    service.applyFilters({ tournamentTypeName: 'Round' });
    expect(service.filteredRuleSets()).toBeTruthy();
  });

  it('should clear filters', () => {
    service.applyFilters({ tournamentTypeName: 'Round' });
    service.clearFilters();
    expect(service.filteredRuleSets()).toBeTruthy();
  });

  it('should apply sort option', () => {
    service.applySortOption('tournamentTypeName_asc');
    expect(service.filteredRuleSets()).toBeTruthy();
  });

  it('should delete a rule set', async () => {
    await service.load();
    const initialCount = service.entities().length;
    const success = await service.deleteRuleSet('trs1');
    expect(success).toBe(true);
    expect(service.entities().length).toBe(initialCount - 1);
  });

  it('should save a new rule set', async () => {
    await service.load();
    const initialCount = service.entities().length;
    const success = await service.saveRuleSet({
      tournamentTypeId: 'tt1',
      tournamentTypeName: 'Round Robin',
      rulesJson: '{}',
      descriptionText: 'Test description',
      isActive: true
    });
    expect(success).toBe(true);
    expect(service.entities().length).toBe(initialCount + 1);
  });
});
