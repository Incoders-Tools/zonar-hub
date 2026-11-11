import { Injectable, inject, signal } from '@angular/core';
import { Player, Category, Gender } from '../../../../core/models';
import { ApiPlayerRepository } from '../../../../core/repositories/api/api-player.repository';
import { PlayerWrite } from '../../../../core/repositories/player.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export interface PlayerFilters {
  search?: string;
  /** `'true'` or `'false'`; unset lists every player. */
  isActive?: string;
}

const PLAYERS_PAGE_SIZE = 25;

/**
 * Server-paged players of the active organization (S3). The API owns search, the active filter, the order (last
 * name, first name) and the total count; pages are rendered as returned. Players are never deleted: they are
 * deactivated and reactivated through the update contract.
 */
@Injectable()
export class PlayerFacadeService {
  private readonly repo = inject(ApiPlayerRepository);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly genderRepo = inject(ApiGenderRepository);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  readonly pageSize = PLAYERS_PAGE_SIZE;

  private readonly playersState = signal<Player[]>([]);
  private readonly pageState = signal(1);
  private readonly totalCountState = signal(0);
  private readonly loadingState = signal(false);
  /** Translation key of the last load failure. */
  private readonly errorState = signal<string | null>(null);
  private readonly savingState = signal(false);
  private readonly updatingStatusState = signal(false);
  private readonly filtersState = signal<PlayerFilters>({});
  private readonly categoriesState = signal<Category[]>([]);
  private readonly gendersState = signal<Gender[]>([]);

  readonly players = this.playersState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly updatingStatus = this.updatingStatusState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly genders = this.gendersState.asReadonly();

  // Monotonic id of the latest load; older responses are ignored when superseded
  private loadRequestId = 0;

  async load(): Promise<void> {
    const requestId = ++this.loadRequestId;
    const filters = this.filtersState();
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const [result, categories, genders] = await Promise.all([
        this.repo.getPage({
          page: this.pageState(),
          pageSize: this.pageSize,
          search: filters.search,
          isActive: filters.isActive === undefined ? undefined : filters.isActive === 'true'
        }),
        this.categoriesState().length ? Promise.resolve(this.categoriesState()) : this.categoryRepo.getAll(),
        this.gendersState().length ? Promise.resolve(this.gendersState()) : this.genderRepo.getAll()
      ]);
      if (requestId !== this.loadRequestId) return;
      this.categoriesState.set(categories);
      this.gendersState.set(genders);
      this.playersState.set(result.items.map(p => this.hydrateNames(p)));
      this.totalCountState.set(result.totalCount);
    } catch (error) {
      if (requestId !== this.loadRequestId) return;
      this.playersState.set([]);
      this.totalCountState.set(0);
      this.errorState.set(errorKey(error));
    } finally {
      if (requestId === this.loadRequestId) this.loadingState.set(false);
    }
  }

  goToPage(page: number): void {
    if (!Number.isInteger(page) || page < 1) return;
    this.pageState.set(page);
    void this.load();
  }

  applyFilters(filters: PlayerFilters): void {
    this.filtersState.set(filters);
    this.pageState.set(1);
    void this.load();
  }

  clearFilters(): void {
    this.applyFilters({});
  }

  /** Creates or updates; a translated toast reports the outcome, including every API error code. */
  async save(player: PlayerWrite, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repo.update(editId, player);
      } else {
        await this.repo.create(player);
      }
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
    } catch (error) {
      this.notification.error(this.i18n.translate(errorKey(error)));
      return false;
    } finally {
      this.savingState.set(false);
    }
    await this.load();
    return true;
  }

  /** Deactivates (new registrations refuse the player) or reactivates the given players, one request each. */
  async setActive(ids: string[], isActive: boolean): Promise<boolean> {
    if (ids.length === 0) return false;
    this.updatingStatusState.set(true);
    try {
      for (const id of ids) {
        await this.repo.setActive(id, isActive);
      }
      this.notification.success(this.i18n.translate(
        isActive ? 'admin.players.feedback.reactivated' : 'admin.players.feedback.deactivated'));
      return true;
    } catch (error) {
      this.notification.error(this.i18n.translate(errorKey(error)));
      return false;
    } finally {
      this.updatingStatusState.set(false);
      // Partial bulk changes are real changes: always show the stored state
      await this.load();
    }
  }

  private hydrateNames(player: Player): Player {
    return {
      ...player,
      categoryName: this.categoriesState().find(c => c.id === player.categoryId)?.name ?? '',
      genderLabel: this.gendersState().find(g => g.id === player.genderId)?.name ?? ''
    };
  }
}

function errorKey(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'toast.error';
}
