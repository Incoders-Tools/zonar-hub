import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AdminRolesPageComponent } from './admin-roles-page.component';
import { RoleFacadeService } from './role-facade.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { Role } from '../../../../core/models';

describe('AdminRolesPageComponent', () => {
  let component: AdminRolesPageComponent;
  let fixture: ComponentFixture<AdminRolesPageComponent>;
  let facadeSpy: jasmine.SpyObj<RoleFacadeService>;

  const mockRoles: Role[] = [
    {
      id: 'r1',
      name: 'system_admin',
      description: 'System role',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: 'r2',
      name: 'custom_role',
      description: 'Custom role',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  ];

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('RoleFacadeService', [
      'load',
      'createRole',
      'updateRole',
      'delete',
      'bulkDelete',
      'applyFilters',
      'clearFilters',
      'sort'
    ]);

    Object.defineProperties(facadeSpy, {
      roles: { value: signal(mockRoles) },
      filteredRoles: { value: signal(mockRoles) },
      loading: { value: signal(false) },
      error: { value: signal<string | null>(null) },
      saving: { value: signal(false) },
      deleting: { value: signal(false) }
    });

    facadeSpy.createRole.and.resolveTo(true);
    facadeSpy.updateRole.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AdminRolesPageComponent],
      providers: [
        I18nService,
        { provide: AuthService, useValue: { isSystemAdmin: () => false } }
      ]
    })
      .overrideComponent(AdminRolesPageComponent, {
        set: {
          providers: [{ provide: RoleFacadeService, useValue: facadeSpy }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminRolesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    expect(facadeSpy.load).toHaveBeenCalled();
  });

  it('should open create form', () => {
    component.openCreateForm();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingRole()).toBeNull();
  });

  it('should open edit form for custom role', () => {
    component.openEditForm({
      id: 'r2',
      name: 'custom_role',
      description: 'Custom role',
      isActive: true,
      statusLabel: 'admin.roles.status.active',
      statusVariant: 'active',
      isSystem: false
    });

    expect(component.showFormPanel()).toBe(true);
    expect(component.editingRole()?.id).toBe('r2');
  });

  it('should not open edit form for system role for non-system-admin user', () => {
    component.openEditForm({
      id: 'r1',
      name: 'system_admin',
      description: 'System role',
      isActive: true,
      statusLabel: 'admin.roles.status.active',
      statusVariant: 'active',
      isSystem: true
    });

    expect(component.showFormPanel()).toBe(false);
    expect(component.editingRole()).toBeNull();
  });

  it('should apply and clear filters', () => {
    component.onFiltersApplied({ name: 'custom', isActive: 'true' });
    expect(facadeSpy.applyFilters).toHaveBeenCalledWith({ name: 'custom', isActive: 'true' });

    component.onFiltersCleared();
    expect(facadeSpy.clearFilters).toHaveBeenCalled();
  });

  it('should confirm delete for non-system role', () => {
    component.confirmDelete({
      id: 'r2',
      name: 'custom_role',
      description: 'Custom role',
      isActive: true,
      statusLabel: 'admin.roles.status.active',
      statusVariant: 'active',
      isSystem: false
    });

    expect(component.showDeleteDialog()).toBe(true);
    expect(component.deletingId()).toBe('r2');
  });

  it('should ignore delete for system role', () => {
    component.confirmDelete({
      id: 'r1',
      name: 'system_admin',
      description: 'System role',
      isActive: true,
      statusLabel: 'admin.roles.status.active',
      statusVariant: 'active',
      isSystem: true
    });

    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });

  it('should execute delete and close dialog', () => {
    component.deletingId.set('r2');
    component.showDeleteDialog.set(true);

    component.executeDelete();

    expect(facadeSpy.delete).toHaveBeenCalledWith('r2');
    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });

  it('should submit create and update payloads', async () => {
    component.openCreateForm();
    await component.onFormSubmitted({ name: 'new_role', description: 'New role description', isActive: true });
    expect(facadeSpy.createRole).toHaveBeenCalled();
    expect(component.showFormPanel()).toBe(false);

    component.editingRole.set(mockRoles[1]);
    component.showFormPanel.set(true);
    await component.onFormSubmitted({ description: 'Updated' });
    expect(facadeSpy.updateRole).toHaveBeenCalledWith('r2', { description: 'Updated' });
  });

  it('should delegate sorting to facade', () => {
    component.onSorted({ key: 'name', direction: 'asc' });
    expect(facadeSpy.sort).toHaveBeenCalledWith('name', 'asc');
  });
});
