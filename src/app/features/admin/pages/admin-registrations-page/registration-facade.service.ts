import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Registration, RegistrationToken, RegistrationSource } from '../../../../core/models';
import { RegistrationService } from '../../../../core/services/registration.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';

export interface RegistrationFilters {
  search?: string;
  statusId?: string;
  source?: string;
  tournamentId?: string;
}

export type RegistrationSortField = 'player1Name' | 'statusLabel' | 'source' | 'registeredAt';

export interface RegistrationSortRule {
  field: RegistrationSortField;
  direction: 'asc' | 'desc';
}

@Injectable()
export class RegistrationFacadeService {
  private readonly service = inject(RegistrationService);
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

  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly filtersState = signal<RegistrationFilters>({});
  private readonly tokenFilterStatus = signal<string | undefined>(undefined);
  private readonly sortRulesState = signal<RegistrationSortRule[]>([
    { field: 'registeredAt', direction: 'desc' }
  ]);

  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  readonly filteredRegistrations = computed(() => {
    const all = this.service.registrations();
    const f = this.filtersState();
    const sortRules = this.sortRulesState();
    let result = [...all];

    if (f.search) {
      const term = f.search.toLowerCase();
      result = result.filter(r =>
        r.player1Name.toLowerCase().includes(term) ||
        r.player2Name.toLowerCase().includes(term)
      );
    }

    if (f.statusId) {
      result = result.filter(r => r.statusId === f.statusId);
    }

    if (f.source) {
      result = result.filter(r => r.source === f.source);
    }

    if (f.tournamentId) {
      result = result.filter(r => r.tournamentId === f.tournamentId);
    }

    if (sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of sortRules) {
          const aVal = (a as unknown as Record<string, unknown>)[rule.field];
          const bVal = (b as unknown as Record<string, unknown>)[rule.field];
          const multiplier = rule.direction === 'desc' ? -1 : 1;
          const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
          if (cmp !== 0) return cmp * multiplier;
        }
        return 0;
      });
    }

    return result;
  });

  readonly tokens = computed(() => this.service.tokens());

  readonly filteredTokens = computed(() => {
    const all = this.service.tokens();
    const f = this.filtersState();
    const tokenStatus = this.tokenFilterStatus();
    let result = [...all];

    if (f.tournamentId) {
      result = result.filter(t => t.tournamentId === f.tournamentId);
    }

    if (tokenStatus === 'active') {
      result = result.filter(t => t.isActive);
    } else if (tokenStatus === 'inactive') {
      result = result.filter(t => !t.isActive);
    }

    return result;
  });

  load(): void {
    this.loadingState.set(false);
    this.errorState.set(false);
  }

  applyFilters(filters: RegistrationFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applyTokenFilters(status?: string): void {
    this.tokenFilterStatus.set(status);
  }

  clearTokenFilters(): void {
    this.tokenFilterStatus.set(undefined);
  }

  applySortRules(rules: RegistrationSortRule[]): void {
    this.sortRulesState.set(rules);
  }

  async save(registration: Omit<Registration, 'id' | 'registeredAt'>, editId?: string): Promise<boolean> {
    this.savingState.set(true);
    try {
      if (editId) {
        await this.service.updateRegistration(editId, registration);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      } else {
        await this.service.submitRegistration(registration);
        this.notification.success(this.i18n.translate('toast.saveSuccess'));
      }
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteRegistration(id: string): Promise<boolean> {
    this.deletingState.set(true);
    try {
      await this.service.deleteRegistration(id);
      this.notification.success(this.i18n.translate('toast.deleteSuccess'));
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async generateToken(tournamentId: string): Promise<RegistrationToken | null> {
    try {
      const token = await this.service.generateToken(tournamentId);
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
      return token;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return null;
    }
  }

  async deactivateToken(id: string): Promise<boolean> {
    try {
      await this.service.deactivateToken(id);
      this.notification.success(this.i18n.translate('toast.saveSuccess'));
      return true;
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
      return false;
    }
  }

  async copyTokenToClipboard(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      this.notification.success(this.i18n.translate('registrations.tokens.copied'));
    } catch {
      this.notification.error(this.i18n.translate('toast.error'));
    }
  }
}
