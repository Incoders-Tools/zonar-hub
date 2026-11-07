import { Injectable, inject, signal } from '@angular/core';
import { AdminDashboardSummary } from '../models';
import { ApiAdminDashboardRepository } from '../repositories/api/api-admin-dashboard.repository';

/** Translation key shown when the summary request fails; raw API errors are never exposed. */
export const ADMIN_DASHBOARD_SUMMARY_ERROR_KEY = 'dashboard.summaryError';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly repository = inject(ApiAdminDashboardRepository);

  /** Null means "no data for the requested organization"; zeros only come from a real response. */
  private readonly summaryState = signal<AdminDashboardSummary | null>(null);
  private readonly summaryOrganizationIdState = signal<string | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private requestSequence = 0;

  readonly summary = this.summaryState.asReadonly();
  readonly summaryOrganizationId = this.summaryOrganizationIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadSummary(organizationId: string | null): Promise<void> {
    // Every call invalidates in-flight requests so late responses cannot overwrite newer state.
    const sequence = ++this.requestSequence;
    this.errorState.set(null);

    if (!organizationId) {
      this.setSummary(null, null);
      this.loadingState.set(false);
      return;
    }

    // Keep the current summary during a same-organization refresh; never show another organization's data.
    if (this.summaryOrganizationIdState() !== organizationId) {
      this.setSummary(null, null);
    }
    this.loadingState.set(true);

    try {
      const summary = await this.repository.getSummary(organizationId);
      if (sequence !== this.requestSequence) return;
      this.setSummary(summary, organizationId);
    } catch {
      if (sequence !== this.requestSequence) return;
      this.setSummary(null, null);
      this.errorState.set(ADMIN_DASHBOARD_SUMMARY_ERROR_KEY);
    } finally {
      if (sequence === this.requestSequence) {
        this.loadingState.set(false);
      }
    }
  }

  private setSummary(summary: AdminDashboardSummary | null, organizationId: string | null): void {
    this.summaryState.set(summary);
    this.summaryOrganizationIdState.set(organizationId);
  }
}
