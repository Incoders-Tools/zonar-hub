import { computed, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { AuthSession, Organization } from '../models';
import { ApiOrganizationRepository } from '../repositories/api/api-organization.repository';
import { ActiveOrganizationService } from './active-organization.service';

class AuthServiceStub {
  private readonly sessionState = signal<AuthSession | null>(null);

  readonly session = computed(() => this.sessionState());
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isSystemAdmin = computed(() => this.currentUser()?.role === 'system_admin');
  readonly updateTenantContext = jasmine.createSpy('updateTenantContext');

  setSession(session: AuthSession | null): void {
    this.sessionState.set(session);
  }

  updateCurrentOrganization(_organizationId: string, _organizationName?: string): void {
    // noop for tests
  }
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
        { provide: ApiOrganizationRepository, useClass: ApiOrganizationRepositoryStub }
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

  it('tracks session organization id when assignments are updated', fakeAsync(() => {
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

    expect(service.activeOrganizationId()).toBe('org-2');
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
