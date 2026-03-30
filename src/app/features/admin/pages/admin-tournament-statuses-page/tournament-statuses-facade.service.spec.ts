import { TestBed } from '@angular/core/testing';
import { TournamentStatusesFacadeService } from './tournament-statuses-facade.service';
import { MockTournamentStatusRepository } from '../../../../core/repositories/mock/mock-tournament-status.repository';

describe('TournamentStatusesFacadeService', () => {
  let service: TournamentStatusesFacadeService;
  let repository: MockTournamentStatusRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TournamentStatusesFacadeService, MockTournamentStatusRepository]
    });
    service = TestBed.inject(TournamentStatusesFacadeService);
    repository = TestBed.inject(MockTournamentStatusRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load statuses', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
  });

  it('should apply filters', () => {
    service.applyFilters({ name: 'test' });
    expect(service.filteredStatuses()).toBeTruthy();
  });

  it('should clear filters', () => {
    service.clearFilters();
    expect(service.filteredStatuses()).toBeTruthy();
  });

  it('should apply sort option', () => {
    service.applySortOption('name_asc');
    expect(service.filteredStatuses()).toBeTruthy();
  });
});
