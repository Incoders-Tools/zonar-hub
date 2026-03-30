import { TestBed } from '@angular/core/testing';
import { TournamentTypesFacadeService } from './tournament-types-facade.service';
import { MockTournamentTypeRepository } from '../../../../core/repositories/mock/mock-tournament-type.repository';

describe('TournamentTypesFacadeService', () => {
  let service: TournamentTypesFacadeService;
  let repository: MockTournamentTypeRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TournamentTypesFacadeService, MockTournamentTypeRepository]
    });
    service = TestBed.inject(TournamentTypesFacadeService);
    repository = TestBed.inject(MockTournamentTypeRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load types', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
  });

  it('should apply filters', () => {
    service.applyFilters({ name: 'test' });
    expect(service.filteredTypes()).toBeTruthy();
  });

  it('should clear filters', () => {
    service.clearFilters();
    expect(service.filteredTypes()).toBeTruthy();
  });

  it('should apply sort option', () => {
    service.applySortOption('name_asc');
    expect(service.filteredTypes()).toBeTruthy();
  });
});
