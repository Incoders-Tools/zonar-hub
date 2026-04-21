import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Player, Category, Gender, Sport } from '../../../../core/models';
import { MockPlayerRepository } from '../../../../core/repositories/mock/mock-player.repository';
import { MockCategoryRepository } from '../../../../core/repositories/mock/mock-category.repository';
import { MockGenderRepository } from '../../../../core/repositories/mock/mock-gender.repository';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';

export interface PlayerFilters {
  search?: string;
  genderId?: string;
  categoryId?: string;
  sportId?: string;
  isActive?: string;
}

@Injectable()
export class PlayerFacadeService {
  private readonly repo = inject(MockPlayerRepository);
  private readonly categoryRepo = inject(MockCategoryRepository);
  private readonly genderRepo = inject(MockGenderRepository);
  private readonly sportRepo = inject(MockSportRepository);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private lastOrgId: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const currentOrgId = this.activeOrg.activeOrganizationId();
      if (this.lastOrgId !== undefined && currentOrgId !== this.lastOrgId) {
        this.load();
      }
      this.lastOrgId = currentOrgId;
    });
  }

  private readonly playersState = signal<Player[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<PlayerFilters>({});
  private readonly sortOptionState = signal('lastName_asc');
  private readonly sortRulesState = signal<{ field: string; dir: 'asc' | 'desc' }[]>([]);

  private readonly categoriesState = signal<Category[]>([]);
  private readonly gendersState = signal<Gender[]>([]);
  private readonly sportsState = signal<Sport[]>([]);

  readonly players = this.playersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  readonly categories = this.categoriesState.asReadonly();
  readonly genders = this.gendersState.asReadonly();
  readonly sports = this.sportsState.asReadonly();

  readonly filteredPlayers = computed(() => {
    const all = this.playersState();
    const f = this.filtersState();
    const sort = this.sortOptionState();
    const activeOrgId = this.activeOrg.activeOrganizationId();
    let result = [...all];

    // Filter by active organization
    if (activeOrgId) {
      result = result.filter(p => !p.organizationId || p.organizationId === activeOrgId);
    }

    if (f.search) {
      const term = f.search.toLowerCase();
      result = result.filter(p =>
        p.firstName.toLowerCase().includes(term) ||
        p.lastName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.documentId && p.documentId.toLowerCase().includes(term))
      );
    }

    if (f.genderId) {
      result = result.filter(p => p.genderId === f.genderId);
    }

    if (f.categoryId) {
      result = result.filter(p => p.categoryId === f.categoryId);
    }

    if (f.sportId) {
      result = result.filter(p => p.sportId === f.sportId);
    }

    if (f.isActive === 'true') {
      result = result.filter(p => p.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(p => !p.isActive);
    }

    const [field, dir] = sort.split('_');
    const sortRules = this.sortRulesState();

    if (sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of sortRules) {
          const cmp = this.comparePlayerField(a, b, rule.field, rule.dir);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    } else {
      const multiplier = dir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[field];
        const bVal = (b as unknown as Record<string, unknown>)[field];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * multiplier;
        }
        return String(aVal ?? '').localeCompare(String(bVal ?? '')) * multiplier;
      });
    }

    return result;
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(false);
    try {
      const [players, categories, genders, sports] = await Promise.all([
        this.repo.getAll(),
        this.categoryRepo.getAll(),
        this.genderRepo.getAll(),
        this.sportRepo.getAll()
      ]);
      this.playersState.set(players);
      this.categoriesState.set(categories);
      this.gendersState.set(genders);
      this.sportsState.set(sports);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: PlayerFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortKey: string): void {
    this.sortOptionState.set(sortKey);
    this.sortRulesState.set([]);
  }

  applySortRules(rules: { field: string; dir: 'asc' | 'desc' }[]): void {
    this.sortRulesState.set(rules);
  }

  private comparePlayerField(a: Player, b: Player, field: string, dir: 'asc' | 'desc'): number {
    const mul = dir === 'asc' ? 1 : -1;
    switch (field) {
      case 'lastName': return a.lastName.localeCompare(b.lastName) * mul;
      case 'firstName': return a.firstName.localeCompare(b.firstName) * mul;
      case 'email': return a.email.localeCompare(b.email) * mul;
      case 'ranking': return ((a.ranking ?? 9999) - (b.ranking ?? 9999)) * mul;
      case 'categoryName': return (a.categoryName ?? '').localeCompare(b.categoryName ?? '') * mul;
      default: {
        const aVal = (a as unknown as Record<string, unknown>)[field];
        const bVal = (b as unknown as Record<string, unknown>)[field];
        return String(aVal ?? '').localeCompare(String(bVal ?? '')) * mul;
      }
    }
  }

  async save(player: Omit<Player, 'id' | 'createdAt'>, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repo.update(editId, player);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      } else {
        await this.repo.create(player);
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

  async deletePlayer(id: string): Promise<boolean> {
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
}
