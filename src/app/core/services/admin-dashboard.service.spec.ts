import { TestBed } from '@angular/core/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiAdminDashboardRepository } from '../repositories/api/api-admin-dashboard.repository';
import { AdminDashboardSummary } from '../models';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let repository: jasmine.SpyObj<ApiAdminDashboardRepository>;

  const summary: AdminDashboardSummary = {
    organizationId: 'org-1',
    totalTournaments: 5,
    activeTournaments: 2,
    finishedTournaments: 2,
    totalPlayers: 20,
    totalRegistrations: 12,
    complexCount: 3,
    courtCount: 8,
    adminCount: 4,
    activeSportsCount: 2
  };

  beforeEach(() => {
    repository = jasmine.createSpyObj<ApiAdminDashboardRepository>('ApiAdminDashboardRepository', ['getSummary']);

    TestBed.configureTestingModule({
      providers: [
        AdminDashboardService,
        { provide: ApiAdminDashboardRepository, useValue: repository }
      ]
    });

    service = TestBed.inject(AdminDashboardService);
  });

  it('loads summary when organization id is provided', async () => {
    repository.getSummary.and.resolveTo(summary);

    await service.loadSummary('org-1');

    expect(repository.getSummary).toHaveBeenCalledWith('org-1');
    expect(service.summary()).toEqual(summary);
    expect(service.error()).toBeNull();
    expect(service.loading()).toBeFalse();
  });

  it('resets summary when organization id is missing', async () => {
    await service.loadSummary(null);

    expect(repository.getSummary).not.toHaveBeenCalled();
    expect(service.summary().organizationId).toBe('');
    expect(service.summary().totalTournaments).toBe(0);
    expect(service.error()).toBeNull();
  });

  it('stores error code when repository fails', async () => {
    repository.getSummary.and.rejectWith(new Error('admin_dashboard.organization_not_found'));

    await service.loadSummary('missing-org');

    expect(service.summary().organizationId).toBe('');
    expect(service.error()).toBe('admin_dashboard.organization_not_found');
    expect(service.loading()).toBeFalse();
  });
});
