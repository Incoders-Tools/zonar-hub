import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../../../../core/models/admin-user.model';
import { MockAdminUserRepository } from '../../../../core/repositories/mock/mock-admin-user.repository';

export interface UsersFilters {
  search?: string;
  roleId?: string;
  complexId?: string;
  isActive?: string;
}

@Injectable()
export class UsersFacadeService {
  private readonly repository = inject(MockAdminUserRepository);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  private readonly filters = signal<UsersFilters>({});
  private readonly sortKey = signal<string>('email');
  private readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly filteredUsers = computed(() => {
    const allUsers = this.users();
    const appliedFilters = this.filters();

    let result = allUsers.filter(user => {
      if (appliedFilters.search) {
        const search = appliedFilters.search.toLowerCase();
        const match = user.email.toLowerCase().includes(search) ||
          user.fullName.toLowerCase().includes(search);
        if (!match) {
          return false;
        }
      }
      if (appliedFilters.roleId && user.roleId !== appliedFilters.roleId) {
        return false;
      }
      if (appliedFilters.complexId !== undefined) {
        const userComplex = user.complexId || 'none';
        if (userComplex !== appliedFilters.complexId) {
          return false;
        }
      }
      if (appliedFilters.isActive !== undefined) {
        const filterValue = appliedFilters.isActive === 'true';
        if (user.isActive !== filterValue) {
          return false;
        }
      }
      return true;
    });

    // Sort
    const key = this.sortKey();
    const dir = this.sortDirection();
    result.sort((a, b) => {
      let aVal: any = a[key as keyof AdminUser];
      let bVal: any = b[key as keyof AdminUser];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
      }
      if (typeof bVal === 'string') {
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      const data = await this.repository.getAll();
      this.users.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  async createUser(data: AdminUserCreatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      const newUser = await this.repository.create(data);
      const current = this.users();
      this.users.set([...current, newUser]);
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create user');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async updateUser(id: string, data: AdminUserUpdatePayload): Promise<boolean> {
    try {
      this.saving.set(true);
      this.error.set(null);
      const updated = await this.repository.update(id, data);
      const current = this.users();
      const idx = current.findIndex(u => u.id === id);
      if (idx !== -1) {
        current[idx] = updated;
        this.users.set([...current]);
      }
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.delete(id);
      const current = this.users();
      this.users.set(current.filter(u => u.id !== id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      this.deleting.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.deleteMany(ids);
      const current = this.users();
      this.users.set(current.filter(u => !ids.includes(u.id)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete users');
    } finally {
      this.deleting.set(false);
    }
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  applyFilters(filters: UsersFilters): void {
    this.filters.set(filters);
  }

  clearFilters(): void {
    this.filters.set({});
  }
}
