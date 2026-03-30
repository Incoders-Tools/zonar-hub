import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminRolesPageComponent } from './admin-roles-page.component';
import { RoleFacadeService } from './role-facade.service';
import { Role } from '../../../../core/models';
import { signal } from '@angular/core';

describe('AdminRolesPageComponent', () => {
  let component: AdminRolesPageComponent;
  let fixture: ComponentFixture<AdminRolesPageComponent>;
  let mockFacadeService: jasmine.SpyObj<RoleFacadeService>;

  const mockRoles: Role[] = [
    {
      id: 'r1',
      name: 'system_admin',
      description: 'Full system access with all permissions',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'r2',
      name: 'custom_role',
      description: 'Custom role for testing',
      isActive: true,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-02-01')
    },
    {
      id: 'r3',
      name: 'inactive_role',
      description: 'Inactive custom role',
      isActive: false,
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date('2025-02-15')
    }
  ];

  beforeEach(async () => {
    mockFacadeService = jasmine.createSpyObj(
      'RoleFacadeService',
      [
        'load',
        'createRole',
        'updateRole',
        'deleteRole',
        'applyFilters',
        'clearFilters',
        'isSystemRole'
      ]
    );

    // Setup signal mocks
    mockFacadeService.roles = signal(mockRoles);
    mockFacadeService.loading = signal(false);
    mockFacadeService.error = signal(null);
    mockFacadeService.filteredRoles = signal(mockRoles);

    await TestBed.configureTestingModule({
      imports: [AdminRolesPageComponent, BrowserAnimationsModule],
      providers: [
        { provide: RoleFacadeService, useValue: mockFacadeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRolesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Lifecycle', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load roles on init', () => {
      expect(mockFacadeService.load).toHaveBeenCalled();
    });

    it('should have initial form closed', () => {
      expect(component.isFormOpen()).toBe(false);
    });

    it('should have no editing role initially', () => {
      expect(component.editingRole()).toBeNull();
    });

    it('should have delete dialog closed initially', () => {
      expect(component.showDeleteDialog()).toBe(false);
    });
  });

  describe('Form Management', () => {
    it('should open create form when openCreateForm is called', () => {
      component.openCreateForm();

      expect(component.isFormOpen()).toBe(true);
      expect(component.editingRole()).toBeNull();
    });

    it('should open edit form with role data', () => {
      const row = {
        id: 'r2',
        name: 'custom_role',
        description: 'Custom role for testing',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: false
      };

      component.openEditForm(row);

      expect(component.isFormOpen()).toBe(true);
      expect(component.editingRole()).toBeTruthy();
      expect(component.editingRole()?.id).toBe('r2');
    });

    it('should prevent opening edit form for system roles', () => {
      const systemRole = {
        id: 'r1',
        name: 'system_admin',
        description: 'System admin role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: true
      };

      component.openEditForm(systemRole);

      // Form should not open or editingRole should not be set
      expect(component.editingRole()).toBeNull();
    });

    it('should close form and clear state', () => {
      component.openCreateForm();
      expect(component.isFormOpen()).toBe(true);

      component.closeForm();

      expect(component.isFormOpen()).toBe(false);
      expect(component.editingRole()).toBeNull();
      expect(component.isSubmitting()).toBe(false);
    });

    it('should reset form on close', () => {
      component.isSubmitting.set(true);
      component.openCreateForm();

      component.closeForm();

      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Row Permissions', () => {
    it('should prevent editing system roles', () => {
      const systemRole = {
        id: 'r1',
        name: 'system_admin',
        description: 'System admin role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: true
      };

      expect(component.canEditRow(systemRole)).toBe(false);
    });

    it('should allow editing custom roles', () => {
      const customRole = {
        id: 'r2',
        name: 'custom_role',
        description: 'Custom role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: false
      };

      expect(component.canEditRow(customRole)).toBe(true);
    });

    it('should prevent deleting system roles', () => {
      const systemRole = {
        id: 'r1',
        name: 'system_admin',
        description: 'System admin role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: true
      };

      expect(component.canDeleteRow(systemRole)).toBe(false);
    });

    it('should allow deleting custom roles', () => {
      const customRole = {
        id: 'r2',
        name: 'custom_role',
        description: 'Custom role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: false
      };

      expect(component.canDeleteRow(customRole)).toBe(true);
    });
  });

  describe('Delete Operations', () => {
    it('should show delete confirmation dialog for custom roles', () => {
      const customRole = {
        id: 'r2',
        name: 'custom_role',
        description: 'Custom role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: false
      };

      component.confirmDelete(customRole);

      expect(component.showDeleteDialog()).toBe(true);
      expect(component.deletingId()).toBe('r2');
    });

    it('should not show delete dialog for system roles', () => {
      const systemRole = {
        id: 'r1',
        name: 'system_admin',
        description: 'System admin role',
        isActive: true,
        statusLabel: 'admin.roles.status.active',
        isSystem: true
      };

      component.confirmDelete(systemRole);

      expect(component.showDeleteDialog()).toBe(false);
    });

    it('should execute delete when confirmed', async () => {
      (mockFacadeService.deleteRole as jasmine.Spy).and.returnValue(Promise.resolve(true));

      component.deletingId.set('r2');
      component.showDeleteDialog.set(true);

      await component.executeDelete();

      expect(mockFacadeService.deleteRole).toHaveBeenCalledWith('r2');
      expect(component.showDeleteDialog()).toBe(false);
      expect(component.deletingId()).toBeNull();
    });

    it('should cancel delete operation', () => {
      component.deletingId.set('r2');
      component.showDeleteDialog.set(true);

      component.cancelDelete();

      expect(component.showDeleteDialog()).toBe(false);
      expect(component.deletingId()).toBeNull();
    });

    it('should handle delete error gracefully', async () => {
      (mockFacadeService.deleteRole as jasmine.Spy).and.returnValue(Promise.resolve(false));

      component.deletingId.set('r2');
      component.showDeleteDialog.set(true);

      await component.executeDelete();

      expect(component.showDeleteDialog()).toBe(true);
      expect(component.deletingId()).toBe('r2');
    });
  });

  describe('Form Submission', () => {
    it('should handle form submission for create', async () => {
      (mockFacadeService.createRole as jasmine.Spy).and.returnValue(Promise.resolve(true));

      component.openCreateForm();
      const formData: Partial<Role> = {
        name: 'test_role',
        description: 'Test role',
        isActive: true
      };

      await component.onFormSubmitted(formData);

      expect(mockFacadeService.createRole).toHaveBeenCalledWith(formData);
      expect(component.isFormOpen()).toBe(false);
    });

    it('should handle form submission for update', async () => {
      (mockFacadeService.updateRole as jasmine.Spy).and.returnValue(Promise.resolve(true));

      const role = mockRoles[1];
      component.editingRole.set(role);
      component.isFormOpen.set(true);

      const formData: Partial<Role> = {
        description: 'Updated description'
      };

      await component.onFormSubmitted(formData);

      expect(mockFacadeService.updateRole).toHaveBeenCalledWith('r2', formData);
      expect(component.isFormOpen()).toBe(false);
    });

    it('should handle form submission failure', async () => {
      (mockFacadeService.createRole as jasmine.Spy).and.returnValue(Promise.resolve(false));

      component.openCreateForm();
      const formData: Partial<Role> = {
        name: 'test_role',
        description: 'Test role',
        isActive: true
      };

      await component.onFormSubmitted(formData);

      expect(component.isFormOpen()).toBe(true);
    });

    it('should set submitting state during form submission', async () => {
      (mockFacadeService.createRole as jasmine.Spy).and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      component.openCreateForm();
      const submissionPromise = component.onFormSubmitted({
        name: 'test_role',
        description: 'Test role',
        isActive: true
      });

      expect(component.isSubmitting()).toBe(true);
      await submissionPromise;
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Computed Values', () => {
    it('should compute canAddRole as true when form is closed', () => {
      component.isFormOpen.set(false);
      expect(component.canAddRole()).toBe(true);
    });

    it('should compute canAddRole as false when form is open', () => {
      component.isFormOpen.set(true);
      expect(component.canAddRole()).toBe(false);
    });

    it('should compute total roles count', () => {
      expect(component.totalRoles()).toBe(3);
    });

    it('should compute custom roles count', () => {
      expect(component.customRolesCount()).toBe(2);
    });

    it('should compute system roles count', () => {
      expect(component.systemRolesCount()).toBe(1);
    });

    it('should map roles to table data correctly', () => {
      const tableData = component.tableData();

      expect(tableData.length).toBe(3);
      expect(tableData[0].name).toBe('system_admin');
      expect(tableData[0].isSystem).toBe(true);
      expect(tableData[1].name).toBe('custom_role');
      expect(tableData[1].isSystem).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct system badge label', () => {
      const label = component.getSystemBadgeLabel();
      expect(label).toBe('admin.roles.badge.system');
    });
  });

  describe('Table Display', () => {
    it('should display all columns', () => {
      expect(component.displayedColumns).toEqual(['name', 'description', 'isActive', 'actions']);
    });

    it('should have correct table data from facade', () => {
      const data = component.tableData();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('description');
      expect(data[0]).toHaveProperty('isActive');
      expect(data[0]).toHaveProperty('statusLabel');
      expect(data[0]).toHaveProperty('isSystem');
    });
  });
});
