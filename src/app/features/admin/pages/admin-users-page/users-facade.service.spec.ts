import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import { Organization } from '../../../../core/models';
import { AdminUser } from '../../../../core/models/admin-user.model';
import { AdminUserPage, AdminUserPageQuery } from '../../../../core/repositories/admin-user.repository';
import { ApiAdminUserRepository } from '../../../../core/repositories/api/api-admin-user.repository';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { UsersFacadeService } from './users-facade.service';

class ApiAdminUserRepositoryStub {
  readonly getPage = jasmine.createSpy('getPage')
    .and.callFake((query: AdminUserPageQuery) => Promise.resolve(emptyPage(query.page)));
  readonly create = jasmine.createSpy('create').and.callFake((payload: any) => Promise.resolve(payload as AdminUser));
  readonly update = jasmine.createSpy('update').and.callFake((_id: string, payload: any) => Promise.resolve(payload as AdminUser));
  readonly delete = jasmine.createSpy('delete').and.resolveTo();
  readonly deleteMany = jasmine.createSpy('deleteMany').and.resolveTo();
}

class ApiOrganizationRepositoryStub {
  organizations: Organization[] = [];
  readonly getAll = jasmine.createSpy('getAll').and.callFake(() => Promise.resolve(this.organizations));
}

class ActiveOrganizationServiceStub {
  private readonly activeOrgIdState = signal<string | null>(null);
  private readonly activeOrgNameState = signal<string>('');

  readonly activeOrganizationId = computed(() => this.activeOrgIdState());
  readonly activeOrganizationName = computed(() => this.activeOrgNameState());

  setActiveOrganization(id: string | null, name = ''): void {
    this.activeOrgIdState.set(id);
    this.activeOrgNameState.set(name);
  }
}

class AuthServiceStub {
  private readonly userState = signal<any | null>(null);

  readonly currentUser = computed(() => this.userState());
  readonly isSystemAdmin = computed(() => this.currentUser()?.role === 'system_admin');

  setUser(user: any | null): void {
    this.userState.set(user);
  }
}

describe('UsersFacadeService', () => {
  let service: UsersFacadeService;
  let usersRepo: ApiAdminUserRepositoryStub;
  let orgRepo: ApiOrganizationRepositoryStub;
  let auth: AuthServiceStub;
  let activeOrg: ActiveOrganizationServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsersFacadeService,
        { provide: ApiAdminUserRepository, useClass: ApiAdminUserRepositoryStub },
        { provide: ApiOrganizationRepository, useClass: ApiOrganizationRepositoryStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ActiveOrganizationService, useClass: ActiveOrganizationServiceStub }
      ]
    });

    usersRepo = TestBed.inject(ApiAdminUserRepository) as unknown as ApiAdminUserRepositoryStub;
    orgRepo = TestBed.inject(ApiOrganizationRepository) as unknown as ApiOrganizationRepositoryStub;
    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    activeOrg = TestBed.inject(ActiveOrganizationService) as unknown as ActiveOrganizationServiceStub;
  });

  function lastQuery(): AdminUserPageQuery {
    return usersRepo.getPage.calls.mostRecent().args[0] as AdminUserPageQuery;
  }

  async function startIn(organizationId: string | null): Promise<void> {
    activeOrg.setActiveOrganization(organizationId, organizationId ?? '');
    service = TestBed.inject(UsersFacadeService);
    TestBed.tick();
    await settle();
  }

  describe('server page query', () => {
    it('requests the first page of 20 in the active organization scope', async () => {
      await startIn('org-1');

      expect(usersRepo.getPage).toHaveBeenCalledTimes(1);
      expect(lastQuery()).toEqual({
        scope: { kind: 'organization', organizationId: 'org-1' },
        page: 1,
        pageSize: 20,
        search: undefined,
        roleId: undefined,
        isActive: undefined
      });
      expect(service.page()).toBe(1);
      expect(service.pageSize).toBe(20);
    });

    it('never requests the all scope, even for a system admin', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      service.goToPage(2);
      service.applyFilters({ search: 'ana' });
      await settle();

      for (const call of usersRepo.getPage.calls.allArgs()) {
        expect((call[0] as AdminUserPageQuery).scope).toEqual({ kind: 'organization', organizationId: 'org-1' });
      }
    });

    it('does not request users when there is no active organization', async () => {
      await startIn(null);

      expect(usersRepo.getPage).not.toHaveBeenCalled();
      expect(service.users()).toEqual([]);
      expect(service.totalCount()).toBe(0);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();

      await service.load();
      service.goToPage(2);
      service.applyFilters({ search: 'ana' });
      await settle();
      expect(usersRepo.getPage).not.toHaveBeenCalled();
    });

    it('exposes the API page as-is, without client visibility filtering or self-injection', async () => {
      auth.setUser(buildCurrentUser('admin-1', 'admin', ['org-1']));
      const unassigned = { ...buildUser('loose-1', 'admin', 'role002', 'org-1'), organizationId: undefined, tenantIds: [], tenantNames: [] };
      const sysadmin = buildUser('sys-9', 'system_admin', 'role001', 'org-1');
      const otherOrg = buildUser('other-1', 'viewer', 'role003', 'org-2');
      usersRepo.getPage.and.resolveTo(page([unassigned, sysadmin, otherOrg], 1, 3));

      await startIn('org-1');

      expect(service.users().map(user => user.id)).toEqual(['loose-1', 'sys-9', 'other-1']);
      expect(service.totalCount()).toBe(3);
    });

    it('stores the server total count independently of the page size', async () => {
      usersRepo.getPage.and.resolveTo(page(buildUsers(20), 1, 45));

      await startIn('org-1');

      expect(service.users().length).toBe(20);
      expect(service.totalCount()).toBe(45);
    });

    it('forwards search, role and status filters to the server and resets to the first page', async () => {
      await startIn('org-1');
      service.goToPage(3);
      await settle();

      service.applyFilters({ search: ' ana ', roleId: 'role003', isActive: 'false' });
      await settle();

      expect(service.page()).toBe(1);
      expect(lastQuery()).toEqual(jasmine.objectContaining({
        page: 1,
        search: ' ana ',
        roleId: 'role003',
        isActive: false
      }));

      service.applyFilters({ isActive: 'true' });
      await settle();
      expect(lastQuery().isActive).toBeTrue();

      service.goToPage(2);
      await settle();
      service.clearFilters();
      await settle();
      expect(service.page()).toBe(1);
      expect(lastQuery()).toEqual(jasmine.objectContaining({ page: 1, search: undefined, roleId: undefined, isActive: undefined }));
    });

    it('requests the selected page and keeps the filters', async () => {
      await startIn('org-1');
      service.applyFilters({ roleId: 'role002' });
      await settle();

      service.goToPage(2);
      await settle();

      expect(service.page()).toBe(2);
      expect(lastQuery()).toEqual(jasmine.objectContaining({ page: 2, pageSize: 20, roleId: 'role002' }));
    });

    it('ignores invalid page numbers', async () => {
      await startIn('org-1');

      service.goToPage(0);
      service.goToPage(1.5);
      await settle();

      expect(service.page()).toBe(1);
      expect(usersRepo.getPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('all organizations scope', () => {
    it('requests the all scope only after an explicit switch by a system admin', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      usersRepo.getPage.calls.reset();

      service.setScope('all');
      await settle();

      expect(service.scope()).toBe('all');
      expect(usersRepo.getPage).toHaveBeenCalledTimes(1);
      expect(lastQuery()).toEqual(jasmine.objectContaining({ scope: { kind: 'all' }, page: 1 }));
    });

    it('refuses the all scope for callers without the system admin role', async () => {
      auth.setUser(buildCurrentUser('admin-1', 'admin', ['org-1']));
      await startIn('org-1');
      usersRepo.getPage.calls.reset();

      service.setScope('all');
      await settle();

      expect(service.scope()).toBe('organization');
      expect(usersRepo.getPage).not.toHaveBeenCalled();
    });

    it('treats repeated switches to the current scope as no-ops', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      usersRepo.getPage.calls.reset();

      service.setScope('organization');
      await settle();
      expect(usersRepo.getPage).not.toHaveBeenCalled();

      service.setScope('all');
      service.setScope('all');
      await settle();
      expect(usersRepo.getPage).toHaveBeenCalledTimes(1);
      expect(lastQuery().scope).toEqual({ kind: 'all' });
    });

    it('resets to the first page whenever the scope changes', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      service.goToPage(3);
      await settle();

      service.setScope('all');
      await settle();
      expect(service.page()).toBe(1);
      expect(lastQuery().page).toBe(1);

      service.goToPage(2);
      await settle();

      service.setScope('organization');
      await settle();
      expect(service.page()).toBe(1);
      expect(lastQuery()).toEqual(jasmine.objectContaining({
        scope: { kind: 'organization', organizationId: 'org-1' },
        page: 1
      }));
    });

    it('keeps the filters while switching scope', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      service.applyFilters({ search: 'ana' });
      await settle();

      service.setScope('all');
      await settle();

      expect(lastQuery()).toEqual(jasmine.objectContaining({ scope: { kind: 'all' }, search: 'ana' }));
    });

    it('allows a system admin to list every organization without an active organization', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn(null);
      expect(usersRepo.getPage).not.toHaveBeenCalled();

      service.setScope('all');
      await settle();

      expect(lastQuery().scope).toEqual({ kind: 'all' });
    });

    it('clears the current rows while the new scope loads', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      usersRepo.getPage.and.resolveTo(page([buildUser('org-user', 'admin', 'role002', 'org-1')], 1, 1));
      await startIn('org-1');
      expect(service.users().map(user => user.id)).toEqual(['org-user']);

      const pendingAll = createDeferred<AdminUserPage>();
      usersRepo.getPage.and.returnValue(pendingAll.promise);
      service.setScope('all');

      expect(service.users()).toEqual([]);
      expect(service.totalCount()).toBe(0);
      expect(service.loading()).toBeTrue();
      expect(service.error()).toBeNull();

      pendingAll.resolve(page([buildUser('global-user', 'viewer', 'role003', 'org-2')], 1, 1));
      await settle();
      expect(service.users().map(user => user.id)).toEqual(['global-user']);
      expect(service.totalCount()).toBe(1);
      expect(service.loading()).toBeFalse();
    });

    it('ignores a stale response from the superseded scope', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');

      const orgPage = createDeferred<AdminUserPage>();
      const allPage = createDeferred<AdminUserPage>();
      usersRepo.getPage.and.returnValues(orgPage.promise, allPage.promise);

      service.goToPage(2);
      service.setScope('all');
      allPage.resolve(page([buildUser('global-1', 'viewer', 'role003', 'org-2')], 1, 1));
      await settle();
      orgPage.resolve(page([buildUser('stale-1', 'admin', 'role002', 'org-1')], 2, 99));
      await settle();

      expect(service.users().map(user => user.id)).toEqual(['global-1']);
      expect(service.totalCount()).toBe(1);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('falls back to the organization scope when the system admin role is revoked', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      service.setScope('all');
      await settle();
      expect(lastQuery().scope).toEqual({ kind: 'all' });

      auth.setUser(buildCurrentUser('admin-1', 'admin', ['org-1']));
      await service.load();

      expect(service.scope()).toBe('organization');
      expect(lastQuery().scope).toEqual({ kind: 'organization', organizationId: 'org-1' });
    });

    it('restores organization mode and resets the page on an active organization switch', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      await startIn('org-1');
      service.setScope('all');
      await settle();
      service.goToPage(2);
      await settle();

      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();
      await settle();

      expect(service.scope()).toBe('organization');
      expect(service.page()).toBe(1);
      expect(lastQuery()).toEqual(jasmine.objectContaining({
        scope: { kind: 'organization', organizationId: 'org-2' },
        page: 1
      }));
    });
  });

  describe('organization lookup', () => {
    it('reads organizations once and never again on pagination or filtering', async () => {
      auth.setUser(buildCurrentUser('sys-1', 'system_admin'));
      orgRepo.organizations = [buildOrganization('org-1', 'Org One'), buildOrganization('org-2', 'Org Two')];

      await startIn('org-1');
      service.goToPage(2);
      service.applyFilters({ search: 'ana' });
      await settle();

      expect(orgRepo.getAll).toHaveBeenCalledTimes(1);
      expect(service.tenants().map(tenant => tenant.id)).toEqual(['org-1', 'org-2']);
    });

    it('limits assignable organizations for non-system admins to their own assignments', async () => {
      auth.setUser(buildCurrentUser('admin-1', 'admin', ['org-1']));
      orgRepo.organizations = [buildOrganization('org-1', 'Org One'), buildOrganization('org-2', 'Org Two')];

      await startIn('org-1');

      expect(service.tenants().map(tenant => tenant.id)).toEqual(['org-1']);
    });

    it('keeps the users list available when the organization lookup fails', async () => {
      orgRepo.getAll.and.rejectWith(new Error('orgs failed'));
      usersRepo.getPage.and.resolveTo(page([buildUser('user-1', 'admin', 'role002', 'org-1')], 1, 1));

      await startIn('org-1');

      expect(service.tenants()).toEqual([]);
      expect(service.error()).toBeNull();
      expect(service.users().map(user => user.id)).toEqual(['user-1']);
    });
  });

  describe('request sequencing', () => {
    let pending: Deferred<AdminUserPage>[];

    beforeEach(() => {
      pending = [];
      usersRepo.getPage.and.callFake(() => {
        const deferred = createDeferred<AdminUserPage>();
        pending.push(deferred);
        return deferred.promise;
      });
      activeOrg.setActiveOrganization('org-1', 'Org One');
    });

    function start(): void {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
    }

    it('loads once on init and once per active organization switch', () => {
      start();
      expect(usersRepo.getPage).toHaveBeenCalledTimes(1);

      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();
      expect(usersRepo.getPage).toHaveBeenCalledTimes(2);
      expect(lastQuery().scope).toEqual({ kind: 'organization', organizationId: 'org-2' });
    });

    it('resets to the first page and clears the previous organization users on switch', async () => {
      start();
      pending[0].resolve(page([buildUser('user-1', 'admin', 'role002', 'org-1')], 1, 41));
      await settle();
      service.goToPage(3);
      pending[1].resolve(page([buildUser('user-41', 'admin', 'role002', 'org-1')], 3, 41));
      await settle();

      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      expect(service.page()).toBe(1);
      expect(lastQuery().page).toBe(1);
      expect(service.users()).toEqual([]);
      expect(service.totalCount()).toBe(0);
      expect(service.loading()).toBeTrue();
      expect(service.error()).toBeNull();
    });

    it('stops loading and clears the list when the active organization becomes null', async () => {
      start();
      pending[0].resolve(page([buildUser('user-1', 'admin', 'role002', 'org-1')], 1, 1));
      await settle();
      service.goToPage(2);

      activeOrg.setActiveOrganization(null);
      TestBed.tick();
      pending[1].resolve(page([buildUser('late', 'admin', 'role002', 'org-1')], 2, 21));
      await settle();

      expect(usersRepo.getPage).toHaveBeenCalledTimes(2);
      expect(service.users()).toEqual([]);
      expect(service.totalCount()).toBe(0);
      expect(service.loading()).toBeFalse();
    });

    it('ignores a stale success from the previous organization', async () => {
      start();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pending[1].resolve(page([buildUser('user-2', 'admin', 'role002', 'org-2')], 1, 1));
      await settle();
      pending[0].resolve(page([buildUser('user-1', 'admin', 'role002', 'org-1')], 1, 99));
      await settle();

      expect(service.users().map(user => user.id)).toEqual(['user-2']);
      expect(service.totalCount()).toBe(1);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('ignores a stale failure from the previous organization', async () => {
      start();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pending[1].resolve(page([buildUser('user-2', 'admin', 'role002', 'org-2')], 1, 1));
      await settle();
      pending[0].reject(new Error('org-1 failed'));
      await settle();

      expect(service.users().map(user => user.id)).toEqual(['user-2']);
      expect(service.error()).toBeNull();
      expect(service.loading()).toBeFalse();
    });

    it('ignores a stale page response that resolves after a later page', async () => {
      start();
      pending[0].resolve(page(buildUsers(20), 1, 60));
      await settle();

      service.goToPage(2);
      service.goToPage(3);
      pending[2].resolve(page(buildUsers(20, 40), 3, 60));
      await settle();
      pending[1].resolve(page(buildUsers(20, 20), 2, 60));
      await settle();

      expect(service.page()).toBe(3);
      expect(service.users()[0].id).toBe('user-41');
      expect(service.loading()).toBeFalse();
    });

    it('ignores a stale filter failure after a newer filter succeeded', async () => {
      start();
      pending[0].resolve(page(buildUsers(20), 1, 60));
      await settle();

      service.applyFilters({ search: 'an' });
      service.applyFilters({ search: 'ana' });
      pending[2].resolve(page(buildUsers(1), 1, 1));
      await settle();
      pending[1].reject(new Error('stale filter failed'));
      await settle();

      expect(service.error()).toBeNull();
      expect(service.totalCount()).toBe(1);
    });

    it('keeps loading truthful while a superseded load settles first', async () => {
      start();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pending[0].reject(new Error('org-1 failed'));
      await settle();
      expect(service.loading()).toBeTrue();
      expect(service.error()).toBeNull();

      pending[1].resolve(page([buildUser('user-2', 'admin', 'role002', 'org-2')], 1, 1));
      await settle();
      expect(service.loading()).toBeFalse();
      expect(service.users().map(user => user.id)).toEqual(['user-2']);
    });

    it('surfaces the latest failure', async () => {
      start();
      const retry = service.load();

      pending[1].reject(new Error('retry failed'));
      await retry;
      pending[0].resolve(page([buildUser('user-1', 'admin', 'role002', 'org-1')], 1, 1));
      await settle();

      expect(service.error()).toBe('retry failed');
      expect(service.users()).toEqual([]);
      expect(service.loading()).toBeFalse();
    });
  });

  describe('mutations', () => {
    beforeEach(async () => {
      usersRepo.getPage.and.callFake((query: AdminUserPageQuery) => Promise.resolve(page(buildUsers(20), query.page, 41)));
      await startIn('org-1');
      service.goToPage(2);
      await settle();
      usersRepo.getPage.calls.reset();
    });

    it('refetches the current page after creating a user', async () => {
      const ok = await service.createUser({ email: 'new@zonar.dev', fullName: 'New', roleId: 'role003' });

      expect(ok).toBeTrue();
      expect(usersRepo.create).toHaveBeenCalledTimes(1);
      expect(usersRepo.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 2 }));
      expect(service.saving()).toBeFalse();
    });

    it('refetches the current page after updating a user', async () => {
      const ok = await service.updateUser('user-21', { fullName: 'Renamed' });

      expect(ok).toBeTrue();
      expect(usersRepo.update).toHaveBeenCalledOnceWith('user-21', { fullName: 'Renamed' });
      expect(usersRepo.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 2 }));
    });

    it('refetches the current page after deleting a user that keeps the page in range', async () => {
      await service.deleteUser('user-21');

      expect(usersRepo.delete).toHaveBeenCalledOnceWith('user-21');
      expect(service.page()).toBe(2);
      expect(usersRepo.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 2 }));
    });

    it('clamps to the new last page when deleting the only user on the last page', async () => {
      service.goToPage(3);
      await settle();
      usersRepo.getPage.calls.reset();

      await service.deleteUser('user-41');

      expect(service.page()).toBe(2);
      expect(usersRepo.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 2 }));
    });

    it('clamps after a bulk delete empties the last page', async () => {
      usersRepo.getPage.and.callFake((query: AdminUserPageQuery) => Promise.resolve(page(buildUsers(2), query.page, 22)));
      await service.load();
      usersRepo.getPage.calls.reset();

      await service.bulkDelete(['user-1', 'user-2']);

      expect(usersRepo.deleteMany).toHaveBeenCalledOnceWith(['user-1', 'user-2']);
      expect(service.page()).toBe(1);
      expect(usersRepo.getPage).toHaveBeenCalledOnceWith(jasmine.objectContaining({ page: 1 }));
    });

    it('does not refetch and reports the error when a mutation fails', async () => {
      usersRepo.update.and.rejectWith(new Error('admin_users.forbidden'));
      usersRepo.delete.and.rejectWith(new Error('admin_users.delete_failed'));

      expect(await service.updateUser('user-21', { fullName: 'x' })).toBeFalse();
      expect(service.error()).toBe('admin_users.forbidden');

      await service.deleteUser('user-21');
      expect(service.error()).toBe('admin_users.delete_failed');
      expect(service.page()).toBe(2);
      expect(usersRepo.getPage).not.toHaveBeenCalled();
    });
  });
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function settle(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve));
}

function emptyPage(pageNumber = 1): AdminUserPage {
  return { items: [], page: pageNumber, pageSize: 20, totalCount: 0 };
}

function page(items: AdminUser[], pageNumber: number, totalCount: number): AdminUserPage {
  return { items, page: pageNumber, pageSize: 20, totalCount };
}

function buildOrganization(id: string, displayName: string): Organization {
  return {
    id,
    tenantId: `tenant-${id}`,
    displayName,
    type: 'circuito',
    isActive: true,
    createdAt: new Date().toISOString(),
    createdByUserId: 'seed-user'
  };
}

function buildCurrentUser(id: string, role: string, tenantIds: string[] = []): any {
  return {
    id,
    email: `${id}@zonar.dev`,
    fullName: id,
    role,
    isActive: true,
    tenantIds,
    organizationId: tenantIds[0],
    createdAt: new Date().toISOString()
  };
}

function buildUsers(count: number, offset = 0): AdminUser[] {
  return Array.from({ length: count }, (_, index) =>
    buildUser(`user-${offset + index + 1}`, 'viewer', 'role003', 'org-1'));
}

function buildUser(id: string, role: string, roleId: string, organizationId: string): AdminUser {
  return {
    id,
    email: `${id}@zonar.dev`,
    fullName: id,
    role,
    roleId,
    roleName: role,
    organizationId,
    tenantIds: [organizationId],
    tenantNames: [organizationId],
    isActive: true,
    createdAt: new Date().toISOString()
  };
}
