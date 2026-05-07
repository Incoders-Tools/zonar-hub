import { Injectable, inject, signal, computed } from '@angular/core';
import { Category } from '../../../../core/models';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export interface CategoryFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class CategoryFacadeService {
  private readonly repo = inject(ApiCategoryRepository);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private readonly categoriesState = signal<Category[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<CategoryFilters>({});
  private readonly sortOptionState = signal('level_asc');

  readonly categories = this.categoriesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  readonly filteredCategories = computed(() => {
    const all = this.categoriesState();
    const f = this.filtersState();
    const sort = this.sortOptionState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.shortName.toLowerCase().includes(term) ||
        c.key.toLowerCase().includes(term)
      );
    }

    if (f.isActive === 'true') {
      result = result.filter(c => c.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(c => !c.isActive);
    }

    const [field, dir] = sort.split('_');
    const multiplier = dir === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[field];
      const bVal = (b as unknown as Record<string, unknown>)[field];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      return String(aVal ?? '').localeCompare(String(bVal ?? '')) * multiplier;
    });

    return result;
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(false);
    try {
      const data = await this.repo.getAll();
      this.categoriesState.set(data);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: CategoryFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortKey: string): void {
    this.sortOptionState.set(sortKey);
  }

  async save(category: Omit<Category, 'id'>, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repo.update(editId, category);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      } else {
        await this.repo.create(category);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      }
      await this.load();
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    this.deletingState.set(true);
    try {
      await this.repo.delete(id);
      this.notification.success(this.i18n.translate('toast.deleteSuccess'));
      await this.load();
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    this.deletingState.set(true);
    try {
      for (const id of ids) {
        await this.repo.delete(id);
      }
      this.notification.success(this.i18n.translate('toast.deleteSuccess'));
      await this.load();
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async getExistingKeys(): Promise<string[]> {
    return this.repo.getExistingKeys();
  }
}
