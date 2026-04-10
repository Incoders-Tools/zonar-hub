import { Injectable, inject, signal, computed } from '@angular/core';
import { Plan } from '../../../../core/models';
import { MockPlanRepository } from '../../../../core/repositories/mock/mock-plan.repository';
import { NotificationService } from '../../../../core/services/notification.service';

export interface PlanFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class PlanFacadeService {
  private readonly repo = inject(MockPlanRepository);
  private readonly notification = inject(NotificationService);

  private readonly plansState = signal<Plan[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<PlanFilters>({});
  private readonly sortState = signal<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  readonly plans = this.plansState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();

  readonly filteredPlans = computed(() => {
    const all = this.plansState();
    const f = this.filtersState();
    const sort = this.sortState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(term) || p.key.toLowerCase().includes(term));
    }

    if (f.isActive === 'true') result = result.filter(p => p.isActive);
    else if (f.isActive === 'false') result = result.filter(p => !p.isActive);

    const multiplier = sort.direction === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sort.key];
      const bVal = (b as unknown as Record<string, unknown>)[sort.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * multiplier;
      return String(aVal ?? '').localeCompare(String(bVal ?? '')) * multiplier;
    });

    return result;
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(false);
    try {
      const data = await this.repo.getAll();
      this.plansState.set(data);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: PlanFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  sort(key: string, direction: 'asc' | 'desc'): void {
    this.sortState.set({ key, direction });
  }

  async createPlan(data: Omit<Plan, 'id'>): Promise<boolean> {
    this.savingState.set(true);
    try {
      await this.repo.create(data);
      this.notification.success('admin.plans.toast.created');
      await this.load();
      return true;
    } catch {
      this.notification.error('admin.plans.toast.createError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<boolean> {
    this.savingState.set(true);
    try {
      await this.repo.update(id, data);
      this.notification.success('admin.plans.toast.updated');
      await this.load();
      return true;
    } catch {
      this.notification.error('admin.plans.toast.updateError');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.deletingState.set(true);
    try {
      await this.repo.delete(id);
      this.notification.success('admin.plans.toast.deleted');
      await this.load();
    } catch {
      this.notification.error('admin.plans.toast.deleteError');
    } finally {
      this.deletingState.set(false);
    }
  }
}
