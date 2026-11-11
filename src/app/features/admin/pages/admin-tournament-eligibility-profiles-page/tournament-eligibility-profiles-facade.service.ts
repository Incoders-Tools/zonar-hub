import { Injectable, inject, signal, computed } from '@angular/core';
import { Category, Gender, TournamentEligibilityProfile } from '../../../../core/models';
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { EligibilityProfileWrite } from '../../../../core/repositories/eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

export interface TournamentEligibilityProfileFilters {
  name?: string;
  isActive?: string;
}

/**
 * Eligibility profiles of the active organization (D1, D5). The API returns every profile ordered by name, so the
 * name and status filters and the name sort run on the loaded list. Every API error code reaches the user as a
 * translated toast; `eligibility_profiles.errors.in_use` explains why a referenced profile cannot be deleted.
 */
@Injectable()
export class TournamentEligibilityProfilesFacadeService {
  private readonly repository = inject(ApiEligibilityProfileRepository);
  private readonly categoryRepo = inject(ApiCategoryRepository);
  private readonly genderRepo = inject(ApiGenderRepository);
  private readonly notification = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private readonly entitiesState = signal<TournamentEligibilityProfile[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  /** Translation key of the last load failure. */
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<TournamentEligibilityProfileFilters>({});
  private readonly sortState = signal<'name_asc' | 'name_desc'>('name_asc');
  private readonly categoriesState = signal<Category[]>([]);
  private readonly gendersState = signal<Gender[]>([]);

  readonly entities = this.entitiesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly genders = this.gendersState.asReadonly();

  readonly filteredProfiles = computed(() => {
    const filters = this.filtersState();
    let result = [...this.entitiesState()];

    const term = filters.name?.trim().toLowerCase();
    if (term) {
      result = result.filter(p => p.name.toLowerCase().includes(term));
    }
    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(p => p.isActive === isActive);
    }

    const direction = this.sortState() === 'name_desc' ? -1 : 1;
    return result.sort((a, b) => a.name.localeCompare(b.name) * direction);
  });

  // Monotonic id of the latest load; older responses are ignored when superseded
  private loadRequestId = 0;

  async load(): Promise<void> {
    const requestId = ++this.loadRequestId;
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const [profiles, categories, genders] = await Promise.all([
        this.repository.getAll(),
        this.categoryRepo.getAll(),
        this.genderRepo.getAll()
      ]);
      if (requestId !== this.loadRequestId) return;
      this.entitiesState.set(profiles);
      this.categoriesState.set(categories);
      this.gendersState.set(genders);
    } catch (error) {
      if (requestId !== this.loadRequestId) return;
      this.entitiesState.set([]);
      this.errorState.set(errorKey(error));
    } finally {
      if (requestId === this.loadRequestId) this.loadingState.set(false);
    }
  }

  applyFilters(filters: TournamentEligibilityProfileFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption === 'name_desc' ? 'name_desc' : 'name_asc');
  }

  async saveProfile(profile: EligibilityProfileWrite, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.repository.update(editId, profile);
      } else {
        await this.repository.create(profile);
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

  async deleteProfile(id: string): Promise<boolean> {
    return this.bulkDelete([id]);
  }

  /** Deletes one by one and stops at the first refusal (for example `in_use`); what was deleted stays deleted. */
  async bulkDelete(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;
    this.deletingState.set(true);
    try {
      for (const id of ids) {
        await this.repository.delete(id);
      }
      this.notification.success(this.i18n.translate('toast.deleteSuccess'));
      return true;
    } catch (error) {
      this.notification.error(this.i18n.translate(errorKey(error)));
      return false;
    } finally {
      this.deletingState.set(false);
      await this.load();
    }
  }

  /** Client hint for the API's 409 `name_taken` (any case); the API stays the authority. */
  isNameTaken(name: string, currentId?: string): boolean {
    const normalized = name.trim().toLowerCase();
    return !!normalized && this.entitiesState().some(p => p.id !== currentId && p.name.toLowerCase() === normalized);
  }
}

function errorKey(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'toast.error';
}
