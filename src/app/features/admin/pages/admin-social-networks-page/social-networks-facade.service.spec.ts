import { TestBed } from '@angular/core/testing';
import { SocialNetworksFacadeService } from './social-networks-facade.service';
import { MockSocialNetworkRepository } from '../../../../core/repositories/mock/mock-social-network.repository';

describe('SocialNetworksFacadeService', () => {
  let service: SocialNetworksFacadeService;
  let repository: MockSocialNetworkRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SocialNetworksFacadeService, MockSocialNetworkRepository]
    });
    service = TestBed.inject(SocialNetworksFacadeService);
    repository = TestBed.inject(MockSocialNetworkRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load networks', async () => {
    await service.load();
    expect(service.entities().length).toBeGreaterThan(0);
  });

  it('should filter networks by name', async () => {
    await service.load();
    service.applyFilters({ name: 'Instagram' });
    expect(service.filteredNetworks().some(n => n.name.includes('Instagram'))).toBe(true);
  });

  it('should save new network', async () => {
    await service.load();
    const beforeCount = service.entities().length;

    const success = await service.saveNetwork({
      name: 'Test Network',
      key: 'test_network',
      url: 'https://test.com',
      description: 'Test',
      faIcon: 'FaTest',
      sortOrder: 99,
      isActive: true
    });

    expect(success).toBe(true);
    expect(service.entities().length).toBe(beforeCount + 1);
  });

  it('should check key uniqueness', async () => {
    await service.load();
    const existingKey = service.entities()[0].key;

    const exists = await service.checkKeyExists(existingKey);
    expect(exists).toBe(true);
  });
});
