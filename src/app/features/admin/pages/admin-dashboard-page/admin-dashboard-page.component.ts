import { Component, inject, computed, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { PlayerService } from '../../../../core/services/player.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { MockComplexRepository } from '../../../../core/repositories/mock/mock-complex.repository';
import { MockAdminUserRepository } from '../../../../core/repositories/mock/mock-admin-user.repository';
import { MockPlanRepository } from '../../../../core/repositories/mock/mock-plan.repository';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';
import { MockSocialNetworkRepository } from '../../../../core/repositories/mock/mock-social-network.repository';
import { OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { Plan } from '../../../../core/models';

interface SetupCheckItem {
  labelKey: string;
  done: boolean;
  routerLink?: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly registrationService = inject(RegistrationService);
  protected readonly playerService = inject(PlayerService);
  protected readonly tenantContext = inject(TenantContextService);
  protected readonly activeOrg = inject(ActiveOrganizationService);
  private readonly adminUserRepo = inject(MockAdminUserRepository);
  private readonly complexRepo = inject(MockComplexRepository);
  private readonly planRepo = inject(MockPlanRepository);
  private readonly sportRepo = inject(MockSportRepository);
  private readonly socialNetworkRepo = inject(MockSocialNetworkRepository);
  protected readonly onboarding = inject(OnboardingStateService);

  readonly currentPlan = signal<Plan | null>(null);
  readonly complexCount = signal(0);
  readonly adminCount = signal(0);
  readonly activeSportsCount = signal(0);
  readonly socialNetworkCount = signal(0);
  readonly courtCount = signal(0);

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
      const planId = this.tenantContext.tenant()?.planId;
      if (planId) {
        this.planRepo.getById(planId).then(plan => this.currentPlan.set(plan)).catch(() => this.currentPlan.set(null));
      } else {
        this.currentPlan.set(null);
      }
    });

    this.complexRepo.getAll().then(list => {
      this.complexCount.set(list.length);
      // Sum courts across all complexes
      let total = 0;
      list.forEach(c => { total += c.courtsCount ?? 0; });
      this.courtCount.set(total);
    });
    this.adminUserRepo.getAll().then(list => this.adminCount.set(list.length));
    this.sportRepo.getAll().then(list => this.activeSportsCount.set(list.filter(s => s.isActive).length));
    this.socialNetworkRepo.getAll().then(list => this.socialNetworkCount.set(list.filter(n => n.isActive).length));
  }

  readonly showSetupPrompt = computed(() => this.tournamentService.tournaments().length === 0);

  readonly activeTournaments = computed(() =>
    this.tournamentService.tournaments().filter(t => t.statusId === 'ts1' || t.statusId === 'ts2').length
  );

  readonly finishedTournaments = computed(() =>
    this.tournamentService.tournaments().filter(t => t.statusId === 'ts3').length
  );

  readonly totalPlayers = computed(() => this.playerService.players().length);
  readonly totalRegistrations = computed(() => this.registrationService.registrations().length);
  readonly totalTournaments = computed(() => this.tournamentService.tournaments().length);

  /** Usage progress: tournaments */
  readonly tournamentUsage = computed(() => {
    const plan = this.currentPlan();
    const current = this.totalTournaments();
    const max = plan?.maxTournaments ?? null;
    return { current, max, percent: max ? Math.min(100, Math.round((current / max) * 100)) : 0 };
  });

  /** Usage progress: admins */
  readonly adminUsage = computed(() => {
    const plan = this.currentPlan();
    const current = this.adminCount();
    const max = plan?.maxAdmins ?? null;
    return { current, max, percent: max ? Math.min(100, Math.round((current / max) * 100)) : 0 };
  });

  /** Usage progress: complexes */
  readonly complexUsage = computed(() => {
    const plan = this.currentPlan();
    const current = this.complexCount();
    const max = plan?.maxComplexes ?? null;
    return { current, max, percent: max ? Math.min(100, Math.round((current / max) * 100)) : 0 };
  });

  /** Registration fill rate */
  readonly registrationFillRate = computed(() => {
    const total = this.totalPlayers();
    const registered = this.totalRegistrations();
    if (total === 0) return 0;
    return Math.round((registered / total) * 100);
  });
}
