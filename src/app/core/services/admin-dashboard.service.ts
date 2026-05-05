import { Injectable, inject, signal } from '@angular/core';
import { AdminDashboardSummary } from '../models';
import { ApiAdminDashboardRepository } from '../repositories/api/api-admin-dashboard.repository';

const EMPTY_SUMMARY: AdminDashboardSummary = {
  organizationId: '',
  totalTournaments: 0,
  activeTournaments: 0,
  finishedTournaments: 0,
  totalPlayers: 0,
  totalRegistrations: 0,
  complexCount: 0,
  courtCount: 0,
  adminCount: 0,
  activeSportsCount: 0
};

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly repository = inject(ApiAdminDashboardRepository);

  private readonly summaryState = signal<AdminDashboardSummary>(EMPTY_SUMMARY);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly summary = this.summaryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadSummary(organizationId: string | null): Promise<void> {
    if (!organizationId) {
      this.summaryState.set(EMPTY_SUMMARY);
      this.errorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const summary = await this.repository.getSummary(organizationId);
      this.summaryState.set(summary);
    } catch (error) {
      this.summaryState.set(EMPTY_SUMMARY);
      this.errorState.set(error instanceof Error ? error.message : 'dashboard.error');
    } finally {
      this.loadingState.set(false);
    }
  }
}
