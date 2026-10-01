import { computed, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { AuthSession, Organization } from '../models';
import { ApiOrganizationRepository } from '../repositories/api/api-organization.repository';
import { ApiUserPreferencesRepository } from '../repositories/api/api-user-preferences.repository';
import { ActiveOrganizationService } from './active-organization.service';

class AuthServiceStub {
  private readonly sessionState = signal<AuthSession | null>(null);

  readonly session = computed(() => this.sessionState());
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isSystemAdmin = computed(() => this.currentUser()?.role === 'system_admin');
  readonly isAdmin = computed(() => ['admin', 'system_admin'].includes(this.currentUser()?.role ?? ''));
  updatePrimaryOrganization = jasmine.createSpy('updatePrimaryOrganization').and.callFake((id: string) => {
    const session = this.sessionState();
    if (session) this.sessionState.set({ ...session, user: { ...session.user, organizationId: id } });
  });
  readonly updateTenantContext = jasmine.createSpy('updateTenantContext');

  setSession(session: AuthSession | null): void {
    this.sessionState.set(session);
  }

  updateCurrentOrganization(organizationId: string, organizationName?: string): void {
    const session = this.sessionState();
    if (session) this.sessionState.set({ ...session, organizationId, organizationName });
  }
}

class ApiUserPreferencesRepositoryStub {
  setPrimaryOrganization = jasmine.createSpy('setPrimaryOrganization').and.resolveTo();
}

class ApiOrganizationRepositoryStub {
  organizations: Organization[] = [];

  getByTenantId = jasmine
    .createSpy('getByTenantId')
    .and.callFake(async (_tenantId: string) => this.organizations);

  getAll = jasmine
    .createSpy('getAll')
    .and.callFake(async () => this.organizations);
}

describe('ActiveOrganizationService', () => {
  let service: ActiveOrganizationService;
  let auth: AuthServiceStub;
  let organizations: ApiOrganizationRepositoryStub;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ActiveOrganizationService,
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ApiOrganizationRepository, useClass: ApiOrganizationRepositoryStub },
        { provide: ApiUserPreferencesRepository, useClass: ApiUserPreferencesRepositoryStub }
      ]
    });

    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    organizations = TestBed.inject(ApiOrganizationRepository) as unknown as ApiOrganizationRepositoryStub;
  });

  it('shows only assigned active organizations for admin with tenantId', fakeAsync(() => {
    organizations.organizations = [
      buildOrganization('org-1', true),
      buildOrganization('org-2', true),
      buildOrganization('org-3', false)
    ];

    auth.setSession(buildSession({ tenantId: 'tenant-a', organizationId: 'org-1', tenantIds: ['org-1'] }));

    service = TestBed.inject(ActiveOrganizationService);
    tick();

    expect(service.manageableOrganizations().map(org => org.id)).toEqual(['org-1']);
  }));

  it('falls back to explicit assignments when tenantId is unavailable', fakeAsync(() => {
    organizations.organizations = [
      buildOrganization('org-1', true),
      buildOrganization('org-2', true)
    ];

    auth.setSession(buildSession({ tenantId: undefined, organizationId: 'org-1', tenantIds: ['org-1'] }));

    service = TestBed.inject(ActiveOrganizationService);
    tick();

    expect(service.manageableOrganizations().map(org => org.id)).toEqual(['org-1']);
  }));

  it('keeps active context when the server primary changes', fakeAsync(() => {
    organizations.organizations = [
      buildOrganization('org-1', true),
      buildOrganization('org-2', true)
    ];

    auth.setSession(buildSession({
      tenantId: 'tenant-a',
      organizationId: 'org-1',
      tenantIds: ['org-1', 'org-2']
    }));

    service = TestBed.inject(ActiveOrganizationService);
    tick();

    expect(service.activeOrganizationId()).toBe('org-1');

    auth.setSession(buildSession({
      tenantId: 'tenant-a',
      organizationId: 'org-2',
      tenantIds: ['org-1', 'org-2']
    }));
    tick();

    expect(service.activeOrganizationId()).toBe('org-1');
    expect(service.primaryOrganizationId()).toBe('org-2');
  }));

  it('keeps the server primary while switching active context', fakeAsync(() => {
    organizations.organizations = [buildOrganization('org-1', true), buildOrganization('org-2', true)];
    auth.setSession(buildSession({ organizationId: 'org-1', tenantIds: ['org-1', 'org-2'] }));
    localStorage.setItem('zh_primary_organization_id_user-1', 'org-2');
    service = TestBed.inject(ActiveOrganizationService);
    tick();
    service.switchOrganization('org-2');
    expect(service.primaryOrganizationId()).toBe('org-1');
    expect(auth.currentUser()?.organizationId).toBe('org-1');
  }));

  it('persists the chosen primary without changing active context', fakeAsync(() => {
    organizations.organizations = [buildOrganization('org-1', true), buildOrganization('org-2', true)];
    auth.setSession(buildSession({ organizationId: 'org-1', tenantIds: ['org-1', 'org-2'] }));
    service = TestBed.inject(ActiveOrganizationService);
    tick();
    const repo = TestBed.inject(ApiUserPreferencesRepository) as unknown as ApiUserPreferencesRepositoryStub;
    void service.setPrimaryOrganization('org-2');
    tick();
    expect(repo.setPrimaryOrganization).toHaveBeenCalledWith('org-2');
    expect(service.primaryOrganizationId()).toBe('org-2');
    expect(service.activeOrganizationId()).toBe('org-1');
  }));

  it('does not change primary or active when the API rejects the update', fakeAsync(() => {
    organizations.organizations = [buildOrganization('org-1', true), buildOrganization('org-2', true)];
    auth.setSession(buildSession({ organizationId: 'org-1', tenantIds: ['org-1', 'org-2'] }));
    service = TestBed.inject(ActiveOrganizationService);
    tick();
    const repo = TestBed.inject(ApiUserPreferencesRepository) as unknown as ApiUserPreferencesRepositoryStub;
    repo.setPrimaryOrganization.and.rejectWith(new Error('forbidden'));
    let failure: unknown;
    void service.setPrimaryOrganization('org-2').catch(error => { failure = error; });
    tick();
    expect(failure).toEqual(jasmine.any(Error));
    expect(service.primaryOrganizationId()).toBe('org-1');
    expect(service.activeOrganizationId()).toBe('org-1');
    expect(auth.updatePrimaryOrganization).not.toHaveBeenCalled();
  }));

  it('restores stored active context into the auth session without changing the primary', fakeAsync(() => {
    organizations.organizations = [buildOrganization('org-1', true), buildOrganization('org-2', true)];
    localStorage.setItem('zh_active_organization_id_user-1', 'org-2');
    auth.setSession(buildSession({ organizationId: 'org-1', tenantIds: ['org-1', 'org-2'] }));
    service = TestBed.inject(ActiveOrganizationService);
    tick();
    expect(service.activeOrganizationId()).toBe('org-2');
    expect(auth.session()?.organizationId).toBe('org-2');
    expect(auth.currentUser()?.organizationId).toBe('org-1');
  }));

  it('rejects an unassigned organization for a system admin primary', fakeAsync(() => {
    organizations.organizations = [buildOrganization('org-1', true), buildOrganization('org-2', true)];
    const session = buildSession({ organizationId: 'org-1', tenantIds: ['org-1'] });
    auth.setSession({ ...session, user: { ...session.user, role: 'system_admin' } });
    service = TestBed.inject(ActiveOrganizationService);
    tick();
    let failure: unknown;
    void service.setPrimaryOrganization('org-2').catch(error => { failure = error; });
    tick();
    expect(failure).toEqual(jasmine.any(Error));
    expect(TestBed.inject(ApiUserPreferencesRepository).setPrimaryOrganization).not.toHaveBeenCalled();
  }));

  it('syncs tenant context with the active organization tenant', fakeAsync(() => {
    organizations.organizations = [
      buildOrganization('org-1', true, 'tenant-a'),
      buildOrganization('org-2', true, 'tenant-b')
    ];

    auth.setSession(buildSession({
      tenantId: undefined,
      organizationId: 'org-2',
      tenantIds: ['org-1', 'org-2']
    }));

    service = TestBed.inject(ActiveOrganizationService);
    tick();

    expect(auth.updateTenantContext).toHaveBeenCalledWith('tenant-b');
  }));
});

function buildSession(overrides: {
  tenantId?: string;
  organizationId?: string;
  tenantIds?: string[];
}): AuthSession {
  const now = new Date().toISOString();

  return {
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      fullName: 'Admin User',
      roleId: 'role002',
      role: 'admin',
      isActive: true,
      tenantId: overrides.tenantId,
      tenantIds: overrides.tenantIds,
      organizationId: overrides.organizationId,
      createdAt: now
    },
    token: 'token',
    expiresAt: now,
    organizationId: overrides.organizationId
  };
}

function buildOrganization(id: string, isActive: boolean, tenantId = 'tenant-a'): Organization {
  return {
    id,
    tenantId,
    displayName: id,
    type: 'circuito',
    isActive,
    createdAt: new Date().toISOString(),
    createdByUserId: 'user-1'
  };
}
