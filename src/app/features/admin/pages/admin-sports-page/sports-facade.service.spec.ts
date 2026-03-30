import { TestBed } from '@angular/core/testing';
import { SportsFacadeService } from './sports-facade.service';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';

describe('SportsFacadeService', () => {
  let service: SportsFacadeService;
  let repository: MockSportRepository;

  const mockSportData = {
    name: 'Test Sport',
    key: 'test_sport',
    icon: '🏀',
    sortOrder: 99,
    isActive: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SportsFacadeService, MockSportRepository]
    });
    service = TestBed.inject(SportsFacadeService);
    repository = TestBed.inject(MockSportRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load sports', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
    expect(service.loading()).toBe(false);
  });

  it('should filter sports by name', async () => {
    await service.load();
    service.applyFilters({ name: 'Pádel' });
    expect(service.filteredSports().every(s => s.name.toLowerCase().includes('pádel'))).toBe(true);
  });

  it('should filter sports by active status', async () => {
    await service.load();
    service.applyFilters({ isActive: 'true' });
    expect(service.filteredSports().every(s => s.isActive === true)).toBe(true);
  });

  it('should clear filters', async () => {
    await service.load();
    service.applyFilters({ name: 'test' });
    service.clearFilters();
    const beforeClear = service.entities().length;
    const afterClear = service.filteredSports().length;
    expect(beforeClear).toBe(afterClear);
  });

  it('should save new sport', async () => {
    await service.load();
    const beforeCount = service.entities().length;

    const success = await service.saveSport(mockSportData);
    expect(success).toBe(true);
    expect(service.entities().length).toBe(beforeCount + 1);
  });

  it('should delete sport', async () => {
    await service.load();
    const sportToDelete = service.entities()[0];

    const success = await service.deleteSport(sportToDelete.id);
    expect(success).toBe(true);
    expect(service.entities().find(s => s.id === sportToDelete.id)).toBeUndefined();
  });

  it('should check key uniqueness', async () => {
    await service.load();
    const existingKey = service.entities()[0].key;

    const exists = await service.checkKeyExists(existingKey);
    expect(exists).toBe(true);

    const notExists = await service.checkKeyExists('unique_key_that_does_not_exist');
    expect(notExists).toBe(false);
  });

  it('should sort sports', async () => {
    await service.load();
    service.applySortOption('name_asc');

    const filtered = service.filteredSports();
    for (let i = 0; i < filtered.length - 1; i++) {
      expect(filtered[i].name <= filtered[i + 1].name).toBe(true);
    }
  });

  it('should get next sort order', async () => {
    await service.load();
    const nextOrder = service.getNextSortOrder();
    expect(nextOrder).toBeGreaterThan(0);
  });
});
