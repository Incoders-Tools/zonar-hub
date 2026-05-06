import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { UsersFacadeService } from './users-facade.service';
import { provideHttpClient } from '@angular/common/http';
import { Tenant } from '../../../../core/models/user.model';
import { ApiPermissionRepository } from '../../../../core/repositories/api/api-permission.repository';

class ApiPermissionRepositoryStub {
  async getCatalog(): Promise<{ modules: any[] }> {
    return {
      modules: [
        {
          key: 'dashboard',
          labelKey: 'admin.permissions.module.dashboard',
          sortOrder: 1,
          isActive: true,
          tools: [
            {
              key: 'dashboard',
              moduleKey: 'dashboard',
              labelKey: 'admin.dashboard',
              route: '/admin',
              sortOrder: 1,
              isSystemAdminOnly: false,
              isActive: true
            }
          ]
        }
      ]
    };
  }

  async getUserPermissions(): Promise<{ permissionsByOrganization: any[] }> {
    return { permissionsByOrganization: [] };
  }
}

describe('AdminUsersPageComponent', () => {
  let component: AdminUsersPageComponent;
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let facade: UsersFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent],
      providers: [
        UsersFacadeService,
        provideHttpClient(),
        { provide: ApiPermissionRepository, useClass: ApiPermissionRepositoryStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(UsersFacadeService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const loadSpy = spyOn(facade, 'load');
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    spyOn(facade, 'applyFilters');
    component.onFiltersApplied({ search: 'john', roleId: 'role001' });
    expect(facade.applyFilters).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    spyOn(facade, 'clearFilters');
    component.onFiltersCleared();
    expect(facade.clearFilters).toHaveBeenCalled();
  });

  it('should open create form', () => {
    fixture.detectChanges();
    component.openCreateForm();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingUser()).toBeNull();
  });

  it('should include editor role in role filter options', () => {
    fixture.detectChanges();

    const roleField = component.filterFields().find(field => field.key === 'roleId');
    const roleValues = (roleField?.options ?? []).map(option => option.value);

    expect(roleValues).toContain('role004');
  });

  it('should expose all active tenant items from facade scope', () => {
    const now = new Date().toISOString();
    const tenants: Tenant[] = [
      {
        id: 'org-1',
        name: 'Org 1',
        key: 'org_1',
        contactEmail: 'org1@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'org-2',
        name: 'Org 2',
        key: 'org_2',
        contactEmail: 'org2@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'org-3',
        name: 'Org 3',
        key: 'org_3',
        contactEmail: 'org3@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    facade.tenants.set(tenants);

    expect(component.tenantItems().map(item => item.id)).toEqual(['org-1', 'org-2']);
  });

  it('should copy permissions from source organization to target organization', () => {
    const now = new Date().toISOString();
    facade.tenants.set([
      {
        id: 'org-1',
        name: 'Org 1',
        key: 'org_1',
        contactEmail: 'org1@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'org-2',
        name: 'Org 2',
        key: 'org_2',
        contactEmail: 'org2@example.com',
        planId: 'plan-1',
        planType: 'starter',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);

    fixture.detectChanges();

    component.onTenantSelectionChanged(new Set(['org-1', 'org-2']));
    component.onPermissionOrganizationChanged('org-1');
    component.onPermissionsChanged(['dashboard', 'users']);

    component.onPermissionOrganizationChanged('org-2');
    component.onCopySourceOrganizationChanged('org-1');
    component.copyPermissionsFromOrganization();

    expect(component.permissionsByOrganization()['org-2']).toEqual(['dashboard', 'users']);
  });
});
