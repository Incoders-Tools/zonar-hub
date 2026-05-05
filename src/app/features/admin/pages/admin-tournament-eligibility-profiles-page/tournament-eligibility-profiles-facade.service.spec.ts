import { TestBed } from '@angular/core/testing';
import { TournamentEligibilityProfilesFacadeService } from './tournament-eligibility-profiles-facade.service';
import { MockTournamentEligibilityProfileRepository } from '../../../../core/repositories/tournament-admin.repository';

describe('TournamentEligibilityProfilesFacadeService', () => {
  let service: TournamentEligibilityProfilesFacadeService;
  let repository: MockTournamentEligibilityProfileRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TournamentEligibilityProfilesFacadeService, MockTournamentEligibilityProfileRepository]
    });
    service = TestBed.inject(TournamentEligibilityProfilesFacadeService);
    repository = TestBed.inject(MockTournamentEligibilityProfileRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load profiles', async () => {
    await repository.create({
      name: 'Open Profile',
      key: 'open_profile',
      description: 'Seeded profile',
      sortOrder: 1,
      isActive: true,
      slots: []
    });

    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
  });

  it('should apply filters', () => {
    service.applyFilters({ name: 'test' });
    expect(service.filteredProfiles()).toBeTruthy();
  });

  it('should clear filters', () => {
    service.clearFilters();
    expect(service.filteredProfiles()).toBeTruthy();
  });

  it('should apply sort option', () => {
    service.applySortOption('name_asc');
    expect(service.filteredProfiles()).toBeTruthy();
  });
});
