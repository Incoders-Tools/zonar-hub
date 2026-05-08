import { Injectable, inject, signal, computed } from '@angular/core';
import { AppLog } from '../../../../core/models/app-log.model';
import { ApiAppLogRepository } from '../../../../core/repositories/api/api-app-log.repository';

export interface AppLogFilters {
  level?: string;
  origin?: string;
  resolved?: string;
  search?: string;
}

@Injectable()
export class AppLogsFacadeService {
  private readonly repository = inject(ApiAppLogRepository);

  readonly logs = signal<AppLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly updating = signal(false);
  readonly cleaning = signal(false);

  private readonly filters = signal<AppLogFilters>({});
  private readonly sortKey = signal<string>('createdAt');
  private readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly filteredLogs = computed(() => {
    const allLogs = this.logs();
    const appliedFilters = this.filters();

    let result = allLogs.filter(log => {
      if (appliedFilters.level && log.level !== appliedFilters.level) {
        return false;
      }
      if (appliedFilters.origin && log.origin !== appliedFilters.origin) {
        return false;
      }
      if (appliedFilters.resolved !== undefined) {
        const filterValue = appliedFilters.resolved === 'true';
        if (log.resolved !== filterValue) {
          return false;
        }
      }
      if (appliedFilters.search) {
        const search = appliedFilters.search.toLowerCase();
        const match = log.message.toLowerCase().includes(search) ||
          (log.route && log.route.toLowerCase().includes(search)) ||
          (log.component && log.component.toLowerCase().includes(search)) ||
          (log.category && log.category.toLowerCase().includes(search));
        if (!match) {
          return false;
        }
      }
      return true;
    });

    // Sort
    const key = this.sortKey();
    const dir = this.sortDirection();
    result.sort((a, b) => {
      let aVal: any = a[key as keyof AppLog];
      let bVal: any = b[key as keyof AppLog];

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
      this.error.set(err instanceof Error ? err.message : 'Failed to load app logs');
    } finally {
      this.loading.set(false);
    }
  }

  async markResolved(id: string, resolved: boolean): Promise<void> {
    this.updating.set(true);
    try {
      await this.repository.markResolved(id, resolved);
      const current = this.logs();
      const idx = current.findIndex(l => l.id === id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], resolved, resolvedAt: resolved ? new Date().toISOString() : undefined };
        this.logs.set([...current]);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update log');
    } finally {
      this.updating.set(false);
    }
  }

  async cleanupOldLogs(retentionDays: number): Promise<number> {
    this.cleaning.set(true);
    try {
      const deleted = await this.repository.cleanupOldLogs(retentionDays);
      await this.load();
      return deleted;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to cleanup logs');
      return 0;
    } finally {
      this.cleaning.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.updating.set(true);
    try {
      await this.repository.delete(id);
      const current = this.logs();
      this.logs.set(current.filter(l => l.id !== id));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete log');
    } finally {
      this.updating.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.updating.set(true);
    try {
      await this.repository.deleteMany(ids);
      const current = this.logs();
      this.logs.set(current.filter(l => !ids.includes(l.id)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete logs');
    } finally {
      this.updating.set(false);
    }
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortKey.set(key);
    this.sortDirection.set(direction);
  }

  applyFilters(filters: AppLogFilters): void {
    this.filters.set(filters);
  }

  clearFilters(): void {
    this.filters.set({});
  }
}
