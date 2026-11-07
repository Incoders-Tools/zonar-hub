import { TestBed } from '@angular/core/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiAdminDashboardRepository } from '../repositories/api/api-admin-dashboard.repository';
import { AdminDashboardSummary } from '../models';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

  const otherSummary: AdminDashboardSummary = { ...summary, organizationId: 'org-2', totalTournaments: 9 };

  const zeroSummary: AdminDashboardSummary = {
    organizationId: 'org-1',
    totalTournaments: 0,
    activeTournaments: 0,
    finishedTournaments: 0,
    totalPlayers: 0,
    totalRegistrations: 0,
    complexCount: 0,
    courtCount: 0,
    adminCount: 0,
    activeSportsCount: 0
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

  it('starts without a summary instead of placeholder zeros', () => {
    expect(service.summary()).toBeNull();
    expect(service.summaryOrganizationId()).toBeNull();
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('loads summary when organization id is provided', async () => {
    repository.getSummary.and.resolveTo(summary);

    await service.loadSummary('org-1');

    expect(repository.getSummary).toHaveBeenCalledWith('org-1');
    expect(service.summary()).toEqual(summary);
    expect(service.summaryOrganizationId()).toBe('org-1');
    expect(service.error()).toBeNull();
    expect(service.loading()).toBeFalse();
  });

  it('keeps a legitimate all-zero summary as loaded data', async () => {
    repository.getSummary.and.resolveTo(zeroSummary);

    await service.loadSummary('org-1');

    expect(service.summary()).toEqual(zeroSummary);
    expect(service.summaryOrganizationId()).toBe('org-1');
    expect(service.error()).toBeNull();
  });

  it('clears summary without requesting when organization id is missing', async () => {
    repository.getSummary.and.resolveTo(summary);
    await service.loadSummary('org-1');

    await service.loadSummary(null);

    expect(repository.getSummary).toHaveBeenCalledTimes(1);
    expect(service.summary()).toBeNull();
    expect(service.summaryOrganizationId()).toBeNull();
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('exposes a translated error key instead of zeros or the raw exception when the request fails', async () => {
    repository.getSummary.and.rejectWith(new Error('admin_dashboard.organization_not_found'));

    await service.loadSummary('missing-org');

    expect(service.summary()).toBeNull();
    expect(service.summaryOrganizationId()).toBeNull();
    expect(service.error()).toBe('dashboard.summaryError');
    expect(service.loading()).toBeFalse();
  });

  it('clears the error and loads data on retry after a failure', async () => {
    repository.getSummary.and.rejectWith(new Error('network'));
    await service.loadSummary('org-1');

    const retry = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValue(retry.promise);
    const pending = service.loadSummary('org-1');

    expect(service.loading()).toBeTrue();
    expect(service.error()).toBeNull();

    retry.resolve(summary);
    await pending;

    expect(service.summary()).toEqual(summary);
    expect(service.error()).toBeNull();
    expect(service.loading()).toBeFalse();
  });

  it('drops the previous organization summary while a different organization is loading', async () => {
    repository.getSummary.and.resolveTo(summary);
    await service.loadSummary('org-1');

    const next = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValue(next.promise);
    const pending = service.loadSummary('org-2');

    expect(service.summary()).toBeNull();
    expect(service.summaryOrganizationId()).toBeNull();
    expect(service.loading()).toBeTrue();

    next.resolve(otherSummary);
    await pending;

    expect(service.summary()).toEqual(otherSummary);
    expect(service.summaryOrganizationId()).toBe('org-2');
  });

  it('keeps the current summary visible while the same organization refreshes', async () => {
    repository.getSummary.and.resolveTo(summary);
    await service.loadSummary('org-1');

    const refresh = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValue(refresh.promise);
    const pending = service.loadSummary('org-1');

    expect(service.summary()).toEqual(summary);
    expect(service.loading()).toBeTrue();

    refresh.resolve({ ...summary, complexCount: 4 });
    await pending;

    expect(service.summary()?.complexCount).toBe(4);
  });

  it('ignores an out-of-order success from a previous organization', async () => {
    const first = deferred<AdminDashboardSummary>();
    const second = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValues(first.promise, second.promise);

    const firstLoad = service.loadSummary('org-1');
    const secondLoad = service.loadSummary('org-2');

    second.resolve(otherSummary);
    await secondLoad;
    first.resolve(summary);
    await firstLoad;

    expect(service.summary()).toEqual(otherSummary);
    expect(service.summaryOrganizationId()).toBe('org-2');
    expect(service.loading()).toBeFalse();
  });

  it('ignores an out-of-order failure from a previous organization', async () => {
    const first = deferred<AdminDashboardSummary>();
    const second = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValues(first.promise, second.promise);

    const firstLoad = service.loadSummary('org-1');
    const secondLoad = service.loadSummary('org-2');

    second.resolve(otherSummary);
    await secondLoad;
    first.reject(new Error('timeout'));
    await firstLoad;

    expect(service.summary()).toEqual(otherSummary);
    expect(service.error()).toBeNull();
    expect(service.loading()).toBeFalse();
  });

  it('keeps loading until the latest request settles even if an older one settles first', async () => {
    const first = deferred<AdminDashboardSummary>();
    const second = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValues(first.promise, second.promise);

    const firstLoad = service.loadSummary('org-1');
    const secondLoad = service.loadSummary('org-2');

    first.reject(new Error('timeout'));
    await firstLoad;

    expect(service.loading()).toBeTrue();
    expect(service.error()).toBeNull();
    expect(service.summary()).toBeNull();

    second.resolve(otherSummary);
    await secondLoad;

    expect(service.loading()).toBeFalse();
    expect(service.summary()).toEqual(otherSummary);
  });

  it('ignores an in-flight response after the organization is cleared', async () => {
    const pendingRequest = deferred<AdminDashboardSummary>();
    repository.getSummary.and.returnValue(pendingRequest.promise);

    const load = service.loadSummary('org-1');
    await service.loadSummary(null);

    expect(service.loading()).toBeFalse();

    pendingRequest.resolve(summary);
    await load;

    expect(service.summary()).toBeNull();
    expect(service.summaryOrganizationId()).toBeNull();
    expect(service.loading()).toBeFalse();
  });
});
