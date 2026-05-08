import { Injectable, inject, signal, computed } from '@angular/core';
import { AuditLog } from '../../../../core/models/operational.model';
import { ApiAuditRepository } from '../../../../core/repositories/api/api-audit.repository';

export interface AuditFilters {
  action?: string;
  entityType?: string;
  userId?: string;
}

@Injectable()
export class AuditFacadeService {
  private readonly repository = inject(ApiAuditRepository);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  private readonly filters = signal<AuditFilters>({});
  private readonly sortKey = signal<string>('timestamp');
  private readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly filteredLogs = computed(() => {
    const allLogs = this.logs();
    const appliedFilters = this.filters();

    let result = allLogs.filter(log => {
      if (appliedFilters.action && log.action !== appliedFilters.action) {
        return false;
      }
      if (appliedFilters.entityType && !log.entityType.toLowerCase().includes(appliedFilters.entityType.toLowerCase())) {
        return false;
      }
      if (appliedFilters.userId && log.userId !== appliedFilters.userId) {
        return false;
      }
      return true;
    });

    // Sort
    const key = this.sortKey();
    const dir = this.sortDirection();
    result.sort((a, b) => {
      let aVal: any = a[key as keyof AuditLog];
      let bVal: any = b[key as keyof AuditLog];

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
      this.logs.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      this.loading.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.delete(id);
      const current = this.logs();
      this.logs.set(current.filter(l => l.id !== id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete log');
    } finally {
      this.deleting.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      await this.repository.deleteMany(ids);
      const current = this.logs();
      this.logs.set(current.filter(l => !ids.includes(l.id)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete logs');
    } finally {
      this.deleting.set(false);
    }
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  applyFilters(filters: AuditFilters): void {
    this.filters.set(filters);
  }

  clearFilters(): void {
    this.filters.set({});
  }
}
