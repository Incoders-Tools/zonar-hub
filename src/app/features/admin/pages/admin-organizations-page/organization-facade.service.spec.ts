import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../core/auth/auth.service';
import { Organization, User } from '../../../../core/models';
import { ApiOrganizationRepository } from '../../../../core/repositories/api/api-organization.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrganizationFacadeService } from './organization-facade.service';

class AuthServiceStub {
  private readonly userState = signal<User | null>({
    id: 'user-1',
    email: 'admin@example.com',
    fullName: 'Admin User',
    roleId: 'role002',
    role: 'admin',
    isActive: true,
    tenantId: 'tenant-a',
    tenantIds: ['org-1'],
    organizationId: 'org-1',
    createdAt: new Date().toISOString()
  });

  readonly currentUser = computed(() => this.userState());

  readonly updateCurrentOrganizationAssignments = jasmine
    .createSpy('updateCurrentOrganizationAssignments')
    .and.callFake((organizationId?: string, tenantIds?: string[]) => {
      const current = this.userState();
      if (!current) return;

      this.userState.set({
        ...current,
        organizationId: organizationId ?? current.organizationId,
        tenantIds: tenantIds ?? current.tenantIds
      });
    });

  readonly updatePrimaryOrganization = jasmine.createSpy('updatePrimaryOrganization');

  readonly updateCurrentOrganization = jasmine
    .createSpy('updateCurrentOrganization')
    .and.callFake((organizationId: string) => {
      const current = this.userState();
      if (!current) return;

      this.userState.set({
        ...current,
        organizationId
      });
    });
}

class ApiOrganizationRepositoryStub {
  private readonly now = new Date().toISOString();
  private readonly items: Organization[] = [
    {
      id: 'org-1',
      tenantId: 'tenant-a',
      displayName: 'Org 1',
      type: 'circuito',
      isActive: true,
      createdAt: this.now,
      createdByUserId: 'user-1',
      updatedAt: this.now
    }
  ];

  readonly getAll = jasmine.createSpy('getAll').and.callFake(async () => [...this.items]);

  readonly create = jasmine
    .createSpy('create')
    .and.callFake(async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created: Organization = {
        ...data,
        id: 'org-2',
        createdAt: this.now,
        updatedAt: this.now
      };

      this.items.push(created);
      return created;
    });

  readonly update = jasmine.createSpy('update').and.callFake(async (_id: string, _changes: Partial<Organization>) => this.items[0]);
  readonly delete = jasmine.createSpy('delete').and.resolveTo();
  readonly deactivate = jasmine.createSpy('deactivate').and.resolveTo(this.items[0]);
}

class ApiSportRepositoryStub {
  readonly setForOrganization = jasmine.createSpy('setForOrganization').and.resolveTo();
}

class NotificationServiceStub {
  readonly success = jasmine.createSpy('success');
  readonly error = jasmine.createSpy('error');
}

class ActiveOrganizationServiceStub {
  readonly setOnboardingOrganization = jasmine.createSpy('setOnboardingOrganization');
  readonly refreshOrganizations = jasmine.createSpy('refreshOrganizations');
}

describe('OrganizationFacadeService', () => {
  let service: OrganizationFacadeService;
  let auth: AuthServiceStub;
  let activeOrg: ActiveOrganizationServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrganizationFacadeService,
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ApiOrganizationRepository, useClass: ApiOrganizationRepositoryStub },
        { provide: ApiSportRepository, useClass: ApiSportRepositoryStub },
        { provide: NotificationService, useClass: NotificationServiceStub },
        { provide: ActiveOrganizationService, useClass: ActiveOrganizationServiceStub }
      ]
    });

    service = TestBed.inject(OrganizationFacadeService);
    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    activeOrg = TestBed.inject(ActiveOrganizationService) as unknown as ActiveOrganizationServiceStub;
  });

  it('assigns a second organization without promoting it over the existing primary', async () => {
    const success = await service.createOrganization(
      {
        displayName: 'Org 2',
        legalName: 'Organization 2',
        description: 'Desc',
        type: 'circuito',
        isActive: true
      },
      ['sport-1']
    );

    expect(success).toBeTrue();

    const assignmentCall = auth.updateCurrentOrganizationAssignments.calls.mostRecent();
    expect(assignmentCall.args[0]).toBe('org-1');
    expect(assignmentCall.args[1]).toEqual(jasmine.arrayContaining(['org-1', 'org-2']));

    expect(auth.updateCurrentOrganization).not.toHaveBeenCalled();
    expect(auth.updatePrimaryOrganization).not.toHaveBeenCalled();
    expect(activeOrg.setOnboardingOrganization).not.toHaveBeenCalled();
    expect(activeOrg.refreshOrganizations).toHaveBeenCalled();
  });
});
