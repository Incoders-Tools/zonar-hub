import { Injectable, inject, signal, computed } from '@angular/core';
import { Role, isSystemRole, RoleCreatePayload, RoleUpdatePayload } from '../../../../core/models';
import { MockRoleRepository } from '../../../../core/repositories/mock/mock-role.repository';

export interface RoleFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class RoleFacadeService {
  private readonly repository = inject(MockRoleRepository);

  readonly roles = signal<Role[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  private readonly filters = signal<RoleFilters>({});
  private readonly sortKey = signal<string>('name');
  private readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly filteredRoles = computed(() => {
    const allRoles = this.roles();
    const appliedFilters = this.filters();

    return allRoles.filter(role => {
      if (appliedFilters.name && !role.name.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
        return false;
      }
      if (appliedFilters.isActive !== undefined) {
        const filterValue = appliedFilters.isActive === 'true';
        if (role.isActive !== filterValue) {
          return false;
        }
      }
      return true;
    });
  });

  /**
   * Loads all roles from repository with error handling
   */
  async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.repository.getAll();
      this.roles.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Creates a new role with validation
   */
  async createRole(data: RoleCreatePayload): Promise<boolean> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const newRole = await this.repository.create(data);
      const current = this.roles();
      this.roles.set([...current, newRole]);
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create role');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Updates an existing role
   */
  async updateRole(id: string, data: RoleUpdatePayload): Promise<boolean> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const updated = await this.repository.update(id, data);
      const current = this.roles();
      const idx = current.findIndex(r => r.id === id);
      if (idx !== -1) {
        current[idx] = updated;
        this.roles.set([...current]);
      }
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update role');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Deletes a role by ID
   */
  async deleteRole(id: string): Promise<boolean> {
    try {
      this.loading.set(true);
      this.error.set(null);
      await this.repository.delete(id);
      const current = this.roles();
      this.roles.set(current.filter(r => r.id !== id));
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete role');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Deletes multiple roles
   */
  async delete(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.delete(id);
      const current = this.roles();
      this.roles.set(current.filter(r => r.id !== id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      this.deleting.set(false);
    }
  }

  /**
   * Bulk delete multiple roles
   */
  async bulkDelete(ids: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      for (const id of ids) {
        await this.repository.delete(id);
      }
      const current = this.roles();
      this.roles.set(current.filter(r => !ids.includes(r.id)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete roles');
    } finally {
      this.deleting.set(false);
    }
  }

  /**
   * Sets sorting for the role list
   */
  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  /**
   * Applies filters to role list
   */
  applyFilters(filters: RoleFilters): void {
    this.filters.set(filters);
  }

  /**
   * Clears all applied filters
   */
  clearFilters(): void {
    this.filters.set({});
  }

  /**
   * Checks if a role is a system role (immutable)
   */
  isSystemRole(roleName: string): boolean {
    return isSystemRole(roleName);
  }
}
