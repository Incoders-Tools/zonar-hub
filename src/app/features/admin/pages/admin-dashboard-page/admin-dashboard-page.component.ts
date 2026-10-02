import { Component, inject, computed, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { ApiPlanRepository } from '../../../../core/repositories/api/api-plan.repository';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { Plan } from '../../../../core/models';

interface SetupCheckItem {
  labelKey: string;
  done: boolean;
  routerLink?: string;
  icon: string;
}

interface UsageProgress {
  current: number;
  max: number | null;
  percent: number;
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent {
  protected readonly dashboardService = inject(AdminDashboardService);
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly activeOrg = inject(ActiveOrganizationService);
  private readonly planRepo = inject(ApiPlanRepository);
  protected readonly onboarding = inject(OnboardingStateService);

  readonly currentPlan = signal<Plan | null>(null);
  readonly summary = this.dashboardService.summary;
  readonly complexCount = computed(() => this.summary()?.complexCount ?? 0);
  readonly adminCount = computed(() => this.summary()?.adminCount ?? 0);
  readonly activeSportsCount = computed(() => this.summary()?.activeSportsCount ?? 0);
  readonly courtCount = computed(() => this.summary()?.courtCount ?? 0);

  /** Setup progress checklist */
  readonly setupChecklist = computed<SetupCheckItem[]>(() => {
    const hasOrg = !!this.activeOrg.activeOrganization();
    const hasComplex = this.complexCount() > 0;
    const hasCourts = this.courtCount() > 0;
    const hasSports = this.activeSportsCount() > 0;
    const hasTournament = this.totalTournaments() > 0;
    const hasRegistrations = this.totalRegistrations() > 0;
    const hasPlayers = this.totalPlayers() > 0;

    return [
      { labelKey: 'dashboard.checklist.organization', done: hasOrg, routerLink: '/admin/system/organizations', icon: '🏛️' },
      { labelKey: 'dashboard.checklist.complex', done: hasComplex, routerLink: '/admin/catalogs/complexes', icon: '🏟️' },
      { labelKey: 'dashboard.checklist.courts', done: hasCourts, routerLink: '/admin/catalogs/complexes', icon: '🎾' },
      { labelKey: 'dashboard.checklist.sports', done: hasSports, routerLink: '/admin/catalogs/sports', icon: '⚽' },
      { labelKey: 'dashboard.checklist.tournament', done: hasTournament, routerLink: '/admin/tournaments', icon: '🏆' },
      { labelKey: 'dashboard.checklist.players', done: hasPlayers, routerLink: '/admin/players', icon: '👥' },
      { labelKey: 'dashboard.checklist.registrations', done: hasRegistrations, routerLink: '/admin/registrations', icon: '📋' }
    ];
  });

  readonly setupProgress = computed(() => {
    const items = this.setupChecklist();
    const done = items.filter(i => i.done).length;
    return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
  });

  readonly isSetupComplete = computed(() => this.setupProgress().percent === 100);

  constructor() {
    effect(() => {
      this.activeOrg.organizationChanged();
      const organizationId = this.activeOrg.activeOrganizationId();
      void this.dashboardService.loadSummary(organizationId);
    });

    effect(() => {
      const planId = this.tenantContext.tenant()?.planId;
      if (planId) {
        this.planRepo
          .getById(planId)
          .then(plan => this.currentPlan.set(plan))
          .catch(() => this.currentPlan.set(null));
      } else {
        this.currentPlan.set(null);
      }
    });
  }

  readonly showSetupPrompt = computed(() => {
    const progress = this.onboarding.progress();
    return progress !== null && !progress.wizardCompleted;
  });

  readonly wizardInProgress = computed(() => {
    const progress = this.onboarding.progress();
    return progress !== null && !progress.wizardCompleted && (progress.wizardStep ?? 0) > 0;
  });

  readonly activeTournaments = computed(() => this.summary()?.activeTournaments ?? 0);

  readonly finishedTournaments = computed(() => this.summary()?.finishedTournaments ?? 0);

  readonly totalPlayers = computed(() => this.summary()?.totalPlayers ?? 0);
  readonly totalRegistrations = computed(() => this.summary()?.totalRegistrations ?? 0);
  readonly totalTournaments = computed(() => this.summary()?.totalTournaments ?? 0);

  /** Usage progress: tournaments */
  readonly tournamentUsage = computed(() =>
    this.toUsageProgress(this.totalTournaments(), this.currentPlan()?.maxTournaments ?? null)
  );

  /** Usage progress: registrations (data scoped to active organization). */
  readonly registrationUsage = computed(() =>
    this.toUsageProgress(this.totalRegistrations(), this.currentPlan()?.maxRegistrations ?? null)
  );

  /** Usage progress: admins */
  readonly adminUsage = computed(() =>
    this.toUsageProgress(this.adminCount(), this.currentPlan()?.maxAdmins ?? null)
  );

  /** Usage progress: complexes */
  readonly complexUsage = computed(() =>
    this.toUsageProgress(this.complexCount(), this.currentPlan()?.maxComplexes ?? null)
  );

  /** Registration fill rate */
  readonly registrationFillRate = computed(() => {
    const total = this.totalPlayers();
    const registered = this.totalRegistrations();
    if (total === 0) return 0;
    return Math.round((registered / total) * 100);
  });

  private toUsageProgress(currentRaw: unknown, maxRaw: unknown): UsageProgress {
    const current = this.toNonNegativeNumber(currentRaw);
    const max = this.toPositiveNumberOrNull(maxRaw);

    if (max === null) {
      return { current, max: null, percent: 0 };
    }

    const rawPercent = (current / max) * 100;
    const clampedPercent = Number.isFinite(rawPercent)
      ? Math.max(0, Math.min(100, Math.round(rawPercent)))
      : 0;

    return {
      current,
      max,
      percent: current >= max ? 100 : clampedPercent
    };
  }

  private toNonNegativeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private toPositiveNumberOrNull(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }
}
