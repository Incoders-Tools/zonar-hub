import { Injectable, inject, signal, computed } from '@angular/core';
import { Gender } from '../../../../core/models';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export interface GenderFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class GenderFacadeService {
  private readonly repo = inject(ApiGenderRepository);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private readonly gendersState = signal<Gender[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<GenderFilters>({});
  private readonly sortOptionState = signal('sortOrder_asc');

  readonly genders = this.gendersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  readonly filteredGenders = computed(() => {
    const all = this.gendersState();
    const f = this.filtersState();
    const sort = this.sortOptionState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(term) ||
        g.key.toLowerCase().includes(term)
      );
    }

    if (f.isActive === 'true') {
      result = result.filter(g => g.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(g => !g.isActive);
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
      this.gendersState.set(data);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: GenderFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortKey: string): void {
    this.sortOptionState.set(sortKey);
  }

  async save(gender: Omit<Gender, 'id'>, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repo.update(editId, gender);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      } else {
        await this.repo.create(gender);
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

  async deleteGender(id: string): Promise<boolean> {
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
