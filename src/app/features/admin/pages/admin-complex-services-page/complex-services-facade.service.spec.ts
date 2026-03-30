import { TestBed } from '@angular/core/testing';
import { ComplexServicesFacadeService } from './complex-services-facade.service';
import { MockComplexServiceRepository } from '../../../../core/repositories/mock/mock-complex-service.repository';
import { ComplexService } from '../../../../core/models';

describe('ComplexServicesFacadeService', () => {
  let service: ComplexServicesFacadeService;
  let repository: MockComplexServiceRepository;

  const mockServiceData = {
    name: 'Test Service',
    key: 'test_service',
    faIcon: 'FaTest',
    sortOrder: 99,
    isActive: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComplexServicesFacadeService, MockComplexServiceRepository]
    });
    service = TestBed.inject(ComplexServicesFacadeService);
    repository = TestBed.inject(MockComplexServiceRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load services', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
    expect(service.loading()).toBe(false);
  });

  it('should filter services by name', async () => {
    await service.load();
    service.applyFilters({ name: 'WiFi' });
    expect(service.filteredServices().every(s => s.name.includes('fili'))).toBe(true);
  });

  it('should filter services by active status', async () => {
    await service.load();
    service.applyFilters({ isActive: 'true' });
    expect(service.filteredServices().every(s => s.isActive === true)).toBe(true);
  });

  it('should clear filters', async () => {
    await service.load();
    service.applyFilters({ name: 'test' });
    service.clearFilters();
    const beforeClear = service.entities().length;
    const afterClear = service.filteredServices().length;
    expect(beforeClear).toBe(afterClear);
  });

  it('should save new service', async () => {
    await service.load();
    const beforeCount = service.entities().length;

    const success = await service.saveService(mockServiceData);
    expect(success).toBe(true);
    expect(service.entities().length).toBe(beforeCount + 1);
  });

  it('should delete service', async () => {
    await service.load();
    const serviceToDelete = service.entities()[0];

    const success = await service.deleteService(serviceToDelete.id);
    expect(success).toBe(true);
    expect(service.entities().find(s => s.id === serviceToDelete.id)).toBeUndefined();
  });

  it('should check key uniqueness', async () => {
    await service.load();
    const existingKey = service.entities()[0].key;

    const exists = await service.checkKeyExists(existingKey);
    expect(exists).toBe(true);

    const notExists = await service.checkKeyExists('unique_key_that_does_not_exist');
    expect(notExists).toBe(false);
  });

  it('should sort services', async () => {
    await service.load();
    service.applySortOption('name_asc');

    const filtered = service.filteredServices();
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
