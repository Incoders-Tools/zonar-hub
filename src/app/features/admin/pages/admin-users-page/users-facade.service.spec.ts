import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import { Organization } from '../../../../core/models';
import { AdminUser } from '../../../../core/models/admin-user.model';
import { ApiAdminUserRepository } from '../../../../core/repositories/api/api-admin-user.repository';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { UsersFacadeService } from './users-facade.service';

class ApiAdminUserRepositoryStub {
  users: AdminUser[] = [];

  async getAll(): Promise<AdminUser[]> {
    return this.users;
  }

  async create(payload: any): Promise<AdminUser> {
    return payload as AdminUser;
  }

  async update(_id: string, payload: any): Promise<AdminUser> {
    return payload as AdminUser;
  }

  async delete(_id: string): Promise<void> {
    return;
  }

  async deleteMany(_ids: string[]): Promise<void> {
    return;
  }
}

class ApiOrganizationRepositoryStub {
  organizations: Organization[] = [];

  async getAll(): Promise<Organization[]> {
    return this.organizations;
  }
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

  it('does not filter users by active organization for system_admin', async () => {
    const now = new Date().toISOString();

    auth.setUser({
      id: 'sys-1',
      email: 'root@zonar.dev',
      fullName: 'Root',
      role: 'system_admin',
      roleId: 'role001',
      isActive: true,
      createdAt: now
    });

    activeOrg.setActiveOrganization('org-1', 'Org One');

    orgRepo.organizations = [
      buildOrganization('org-1', 'Org One'),
      buildOrganization('org-2', 'Org Two')
    ];

    usersRepo.users = [
      buildUser('sys-1', 'root@zonar.dev', 'system_admin', 'role001', 'org-1'),
      buildUser('user-2', 'admin2@zonar.dev', 'admin', 'role002', 'org-2')
    ];

    service = TestBed.inject(UsersFacadeService);
    await service.load();

    const visibleIds = service.filteredUsers().map(user => user.id);
    expect(visibleIds).toContain('sys-1');
    expect(visibleIds).toContain('user-2');
  });

  it('filters users by active organization for non-system admins', async () => {
    const now = new Date().toISOString();

    auth.setUser({
      id: 'admin-1',
      email: 'admin@zonar.dev',
      fullName: 'Admin',
      role: 'admin',
      roleId: 'role002',
      isActive: true,
      tenantIds: ['org-1'],
      organizationId: 'org-1',
      createdAt: now
    });

    activeOrg.setActiveOrganization('org-1', 'Org One');

    orgRepo.organizations = [
      buildOrganization('org-1', 'Org One'),
      buildOrganization('org-2', 'Org Two')
    ];

    usersRepo.users = [
      buildUser('admin-1', 'admin@zonar.dev', 'admin', 'role002', 'org-1'),
      buildUser('user-2', 'viewer2@zonar.dev', 'viewer', 'role003', 'org-2')
    ];

    service = TestBed.inject(UsersFacadeService);
    await service.load();

    const visibleIds = service.filteredUsers().map(user => user.id);
    expect(visibleIds).toContain('admin-1');
    expect(visibleIds).not.toContain('user-2');
  });

  describe('load sequencing', () => {
    let pendingUsers: Deferred<AdminUser[]>[];

    beforeEach(() => {
      pendingUsers = [];
      spyOn(usersRepo, 'getAll').and.callFake(() => {
        const deferred = createDeferred<AdminUser[]>();
        pendingUsers.push(deferred);
        return deferred.promise;
      });
      activeOrg.setActiveOrganization('org-1', 'Org One');
    });

    it('loads once on init and once per active organization switch', () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      expect(usersRepo.getAll).toHaveBeenCalledTimes(1);

      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();
      expect(usersRepo.getAll).toHaveBeenCalledTimes(2);
    });

    it('clears previous organization users while the new organization loads', async () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      pendingUsers[0].resolve([buildUser('user-1', 'one@zonar.dev', 'admin', 'role002', 'org-1')]);
      await settle();
      expect(service.users().map(user => user.id)).toEqual(['user-1']);

      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      expect(service.users()).toEqual([]);
      expect(service.loading()).toBeTrue();
      expect(service.error()).toBeNull();
    });

    it('ignores a stale initial load success that resolves after the switched organization', async () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pendingUsers[1].resolve([buildUser('user-2', 'two@zonar.dev', 'admin', 'role002', 'org-2')]);
      await settle();
      pendingUsers[0].resolve([buildUser('user-1', 'one@zonar.dev', 'admin', 'role002', 'org-1')]);
      await settle();

      expect(service.users().map(user => user.id)).toEqual(['user-2']);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('ignores a stale initial load failure that rejects after the switched organization succeeded', async () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pendingUsers[1].resolve([buildUser('user-2', 'two@zonar.dev', 'admin', 'role002', 'org-2')]);
      await settle();
      pendingUsers[0].reject(new Error('org-1 failed'));
      await settle();

      expect(service.users().map(user => user.id)).toEqual(['user-2']);
      expect(service.error()).toBeNull();
      expect(service.loading()).toBeFalse();
    });

    it('keeps loading truthful while a superseded load settles before the latest one', async () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      activeOrg.setActiveOrganization('org-2', 'Org Two');
      TestBed.tick();

      pendingUsers[0].reject(new Error('org-1 failed'));
      await settle();

      expect(service.loading()).toBeTrue();
      expect(service.error()).toBeNull();
      expect(service.users()).toEqual([]);

      pendingUsers[1].resolve([buildUser('user-2', 'two@zonar.dev', 'admin', 'role002', 'org-2')]);
      await settle();

      expect(service.loading()).toBeFalse();
      expect(service.users().map(user => user.id)).toEqual(['user-2']);
    });

    it('applies only the latest retry when an earlier load in the same organization settles later', async () => {
      service = TestBed.inject(UsersFacadeService);
      TestBed.tick();
      const retry = service.load();

      pendingUsers[1].reject(new Error('retry failed'));
      await retry;
      pendingUsers[0].resolve([buildUser('user-1', 'one@zonar.dev', 'admin', 'role002', 'org-1')]);
      await settle();

      expect(service.error()).toBe('retry failed');
      expect(service.users()).toEqual([]);
      expect(service.loading()).toBeFalse();
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

function buildUser(
  id: string,
  email: string,
  role: string,
  roleId: string,
  organizationId: string
): AdminUser {
  return {
    id,
    email,
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
