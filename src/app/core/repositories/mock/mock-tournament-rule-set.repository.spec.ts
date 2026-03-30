import { TestBed } from '@angular/core/testing';
import { MockTournamentRuleSetRepository } from './mock-tournament-rule-set.repository';

describe('MockTournamentRuleSetRepository', () => {
  let repository: MockTournamentRuleSetRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockTournamentRuleSetRepository]
    });
    repository = TestBed.inject(MockTournamentRuleSetRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('should return all rule sets', async () => {
    const ruleSets = await repository.getAll();
    expect(ruleSets.length).toBe(2);
  });

  it('should return a rule set by id', async () => {
    const ruleSet = await repository.getById('trs1');
    expect(ruleSet).toBeTruthy();
    expect(ruleSet?.tournamentTypeName).toBe('Round Robin');
  });

  it('should return undefined for non-existent id', async () => {
    const ruleSet = await repository.getById('non-existent');
    expect(ruleSet).toBeUndefined();
  });

  it('should create a new rule set', async () => {
    const created = await repository.create({
      tournamentTypeId: 'tt1',
      tournamentTypeName: 'Test',
      rulesJson: '{}',
      descriptionText: 'Test',
      isActive: true
    });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();

    const all = await repository.getAll();
    expect(all.length).toBe(3);
  });

  it('should update a rule set', async () => {
    const updated = await repository.update('trs1', { descriptionText: 'Updated' });
    expect(updated.descriptionText).toBe('Updated');
  });

  it('should throw error when updating non-existent rule set', async () => {
    await expectAsync(repository.update('non-existent', {})).toBeRejectedWithError();
  });

  it('should delete a rule set', async () => {
    await repository.delete('trs1');
    const all = await repository.getAll();
    expect(all.length).toBe(1);
  });
});
