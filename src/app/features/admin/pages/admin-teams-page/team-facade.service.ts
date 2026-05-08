import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Team, Sport, Category, Player } from '../../../../core/models';
import { ApiTeamRepository } from '../../../../core/repositories/api/api-team.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiPlayerRepository } from '../../../../core/repositories/api/api-player.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';

export interface TeamFilters {
  search?: string;
  sportId?: string;
  categoryId?: string;
  isActive?: string;
}

@Injectable()
export class TeamFacadeService {
  private readonly repo = inject(ApiTeamRepository);
  private readonly sportRepo = inject(ApiSportRepository);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly playerRepo = inject(ApiPlayerRepository);
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

  private readonly teamsState = signal<Team[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<TeamFilters>({});
  private readonly sortRulesState = signal<{ field: string; dir: 'asc' | 'desc' }[]>([]);

  private readonly sportsState = signal<Sport[]>([]);
  private readonly categoriesState = signal<Category[]>([]);
  private readonly playersState = signal<Player[]>([]);

  readonly teams = this.teamsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly sports = this.sportsState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly players = this.playersState.asReadonly();

  readonly filteredTeams = computed(() => {
    const all = this.teamsState();
    const f = this.filtersState();
    const activeOrgId = this.activeOrg.activeOrganizationId();
    const rules = this.sortRulesState();
    let result = [...all];

    if (activeOrgId) {
      result = result.filter(t => !t.organizationId || t.organizationId === activeOrgId);
    }

    if (f.search) {
      const term = f.search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        (t.sportName ?? '').toLowerCase().includes(term) ||
        t.players.some(p => p.playerName.toLowerCase().includes(term))
      );
    }

    if (f.sportId) {
      result = result.filter(t => t.sportId === f.sportId);
    }

    if (f.categoryId) {
      result = result.filter(t => t.categoryId === f.categoryId);
    }

    if (f.isActive === 'true') {
      result = result.filter(t => t.isActive);
    } else if (f.isActive === 'false') {
      result = result.filter(t => !t.isActive);
    }

    if (rules.length > 0) {
      result.sort((a, b) => {
        for (const rule of rules) {
          const mul = rule.dir === 'asc' ? 1 : -1;
          const aVal = (a as unknown as Record<string, unknown>)[rule.field];
          const bVal = (b as unknown as Record<string, unknown>)[rule.field];
          const cmp = String(aVal ?? '').localeCompare(String(bVal ?? '')) * mul;
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(false);
    try {
      const [teams, sports, categories, players] = await Promise.all([
        this.repo.getAll(),
        this.sportRepo.getAll(),
        this.categoryRepo.getAll(),
        this.playerRepo.getAll()
      ]);
      this.teamsState.set(teams);
      this.sportsState.set(sports);
      this.categoriesState.set(categories);
      this.playersState.set(players);
    } catch {
      this.errorState.set(true);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: TeamFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortRules(rules: { field: string; dir: 'asc' | 'desc' }[]): void {
    this.sortRulesState.set(rules);
  }

  async save(team: Omit<Team, 'id' | 'createdAt'>, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repo.update(editId, team);
      } else {
        await this.repo.create(team);
      }
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
      await this.load();
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteTeam(id: string): Promise<boolean> {
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
      await this.repo.bulkDelete(ids);
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

  getSportName(id: string): string {
    return this.sportsState().find(s => s.id === id)?.name ?? '';
  }

  getCategoryName(id: string): string {
    return this.categoriesState().find(c => c.id === id)?.name ?? '';
  }
}
