import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { OnboardingProgress, OnboardingStateService } from '../../../../core/services/onboarding-state.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AdminDashboardSummary, Plan } from '../../../../core/models';
import { provideHttpClient } from '@angular/common/http';

const loadedSummary: AdminDashboardSummary = {
  organizationId: 'org-1',
  totalTournaments: 3,
  activeTournaments: 2,
  finishedTournaments: 1,
  totalPlayers: 8,
  totalRegistrations: 4,
  complexCount: 1,
  courtCount: 5,
  adminCount: 1,
  activeSportsCount: 1
};

const zeroSummary: AdminDashboardSummary = {
  organizationId: 'org-1',
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

const plan: Plan = {
  id: 'plan-1',
  name: 'Starter',
  key: 'starter',
  priceMonthly: 0,
  priceAnnual: 0,
  priceSingleUse: null,
  maxTournaments: 3,
  maxRegistrations: null,
  maxAdmins: 1,
  maxComplexes: 1,
  maxCourts: 4,
  features: [],
  dedicatedServer: false,
  dedicatedDatabase: false,
  dedicatedAI: false,
  isActive: true
};

class AdminDashboardServiceStub {
  readonly summaryState = signal<AdminDashboardSummary | null>(loadedSummary);
  readonly summaryOrganizationIdState = signal<string | null>('org-1');
  readonly loadingState = signal(false);
  readonly errorState = signal<string | null>(null);

  readonly summary = this.summaryState.asReadonly();
  readonly summaryOrganizationId = this.summaryOrganizationIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly loadSummary = jasmine.createSpy('loadSummary').and.resolveTo();
}

class ActiveOrganizationServiceStub {
  readonly activeOrganizationId = signal<string | null>('org-1');
  readonly activeOrganization = computed(() => {
    const id = this.activeOrganizationId();
    return id ? { id, name: `Org ${id}` } : null;
  });
  readonly activeOrganizationName = computed(() => this.activeOrganization()?.name ?? '');
  readonly organizationChanged = signal(0);
}

class OnboardingStateServiceStub {
  readonly progress = signal<OnboardingProgress | null>(null);
}

describe('AdminDashboardPageComponent', () => {
  let component: AdminDashboardPageComponent;
  let fixture: ComponentFixture<AdminDashboardPageComponent>;
  let dashboard: AdminDashboardServiceStub;
  let activeOrg: ActiveOrganizationServiceStub;
  let onboarding: OnboardingStateServiceStub;
  let i18n: I18nService;

  const query = (selector: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(selector);
  const statValues = (): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.stat-card__value')).map(el =>
      (el.textContent ?? '').trim()
    );

  const showFailure = (): void => {
    dashboard.summaryState.set(null);
    dashboard.summaryOrganizationIdState.set(null);
    dashboard.errorState.set('dashboard.summaryError');
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AdminDashboardService, useClass: AdminDashboardServiceStub },
        { provide: ActiveOrganizationService, useClass: ActiveOrganizationServiceStub },
        { provide: OnboardingStateService, useClass: OnboardingStateServiceStub }
      ]
    }).compileComponents();

    dashboard = TestBed.inject(AdminDashboardService) as unknown as AdminDashboardServiceStub;
    activeOrg = TestBed.inject(ActiveOrganizationService) as unknown as ActiveOrganizationServiceStub;
    onboarding = TestBed.inject(OnboardingStateService) as unknown as OnboardingStateServiceStub;
    i18n = TestBed.inject(I18nService);

    fixture = TestBed.createComponent(AdminDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the summary for the active organization', () => {
    expect(dashboard.loadSummary).toHaveBeenCalledWith('org-1');
  });

  it('renders loaded stats and hides the checklist once setup is complete', () => {
    expect(statValues()).toEqual(['3', '2', '1', '8', '4', '1']);
    expect(query('.setup-checklist')).toBeNull();
    expect(query('[data-testid="dashboard-summary-charts"]')).not.toBeNull();
    expect(query('[data-testid="dashboard-summary-error"]')).toBeNull();
    expect(query('[data-testid="dashboard-summary-loading"]')).toBeNull();
  });

  it('shows a loading status instead of placeholder zeros while the summary loads', () => {
    dashboard.summaryState.set(null);
    dashboard.summaryOrganizationIdState.set(null);
    dashboard.loadingState.set(true);
    fixture.detectChanges();

    const loading = query('[data-testid="dashboard-summary-loading"]');
    expect(loading).not.toBeNull();
    expect(loading?.getAttribute('role')).toBe('status');
    expect(loading?.textContent).toContain(i18n.translate('common.loading'));
    expect(query('.setup-checklist')).toBeNull();
    expect(query('.stats-grid')).toBeNull();
    expect(query('[data-testid="dashboard-summary-charts"]')).toBeNull();
  });

  it('shows a translated error with retry instead of pending checklist, stats, usage or overview', () => {
    component.currentPlan.set(plan);
    showFailure();

    const alert = query('[data-testid="dashboard-summary-error"]');
    expect(alert).not.toBeNull();
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(i18n.translate('dashboard.summaryError')).not.toBe('dashboard.summaryError');
    expect(alert?.textContent).toContain(i18n.translate('dashboard.summaryError'));
    expect(alert?.textContent).not.toContain('dashboard.summaryError');
    expect(query('.setup-checklist')).toBeNull();
    expect(query('.stats-grid')).toBeNull();
    expect(query('.usage-grid')).toBeNull();
    expect(query('[data-testid="dashboard-summary-charts"]')).toBeNull();
  });

  it('keeps quick-action links available without charts while the summary fails or loads', () => {
    const quickActionLinks = (): string[] =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.quick-action')).map(
        el => el.getAttribute('href') ?? ''
      );
    const expectedLinks = ['/admin/tournaments', '/admin/players', '/admin/registrations', '/admin/catalogs/complexes'];

    showFailure();

    expect(quickActionLinks()).toEqual(expectedLinks);
    expect(query('[data-testid="dashboard-summary-charts"]')).toBeNull();
    expect(query('.metric-ring')).toBeNull();

    dashboard.errorState.set(null);
    dashboard.loadingState.set(true);
    fixture.detectChanges();

    expect(quickActionLinks()).toEqual(expectedLinks);
    expect(query('[data-testid="dashboard-summary-charts"]')).toBeNull();
  });

  it('hides quick actions while the onboarding setup prompt is shown, as before', () => {
    onboarding.progress.set({
      userId: 'user-1',
      wizardCompleted: false,
      wizardStep: 0,
      tourCompleted: false,
      tourStep: 0,
      createdTournament: false,
      organizationCreated: false
    });
    showFailure();

    expect(query('a.quick-action')).toBeNull();
  });

  it('shows only the truthful create-organization step when there is no active organization', () => {
    dashboard.summaryState.set(null);
    dashboard.summaryOrganizationIdState.set(null);
    activeOrg.activeOrganizationId.set(null);
    fixture.detectChanges();

    const link = query('.setup-checklist a.setup-checklist__label--link');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/admin/system/organizations');
    expect(link?.textContent?.trim()).toBe(i18n.translate('dashboard.checklist.organization'));
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.setup-checklist__item').length).toBe(1);
    expect(query('.setup-checklist__progress')).toBeNull();
    expect(query('.stats-grid')).toBeNull();
    expect(query('[data-testid="dashboard-summary-loading"]')).toBeNull();
    expect(query('[data-testid="dashboard-summary-error"]')).toBeNull();
  });

  it('retries the summary for the current active organization with a non-submitting secondary button', () => {
    showFailure();
    activeOrg.activeOrganizationId.set('org-2');
    fixture.detectChanges();
    dashboard.loadSummary.calls.reset();

    const retry = query('[data-testid="dashboard-summary-error"] app-async-button button') as HTMLButtonElement;
    expect(retry).not.toBeNull();
    expect(retry.getAttribute('type')).toBe('button');
    expect(retry.classList).toContain('async-btn--secondary');
    expect(retry.textContent).toContain(i18n.translate('common.retry'));

    retry.click();

    expect(dashboard.loadSummary).toHaveBeenCalledOnceWith('org-2');
  });

  it('replaces the error with the loading status once retry starts a new request', () => {
    showFailure();
    // Mirrors the real service: a new request clears the error and sets loading.
    dashboard.loadSummary.and.callFake(async () => {
      dashboard.errorState.set(null);
      dashboard.loadingState.set(true);
    });

    (query('[data-testid="dashboard-summary-error"] app-async-button button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(query('[data-testid="dashboard-summary-error"]')).toBeNull();
    expect(query('[data-testid="dashboard-summary-loading"]')).not.toBeNull();
  });

  it('renders a legitimate all-zero summary as real progress', () => {
    dashboard.summaryState.set(zeroSummary);
    fixture.detectChanges();

    expect(statValues()).toEqual(['0', '0', '0', '0', '0', '0']);
    expect(query('.setup-checklist__progress')?.textContent?.trim()).toBe('1/7');
    expect(query('[data-testid="dashboard-summary-error"]')).toBeNull();
  });

  it('hides the previous organization summary after an organization change and reloads', () => {
    activeOrg.activeOrganizationId.set('org-2');
    dashboard.loadingState.set(true);
    fixture.detectChanges();

    expect(dashboard.loadSummary).toHaveBeenCalledWith('org-2');
    expect(query('.stats-grid')).toBeNull();
    expect(query('.setup-checklist')).toBeNull();
    expect(query('[data-testid="dashboard-summary-loading"]')).not.toBeNull();
  });

  it('keeps the onboarding banner driven by onboarding progress while the summary fails or loads', () => {
    onboarding.progress.set({
      userId: 'user-1',
      wizardCompleted: false,
      wizardStep: 2,
      tourCompleted: false,
      tourStep: 0,
      createdTournament: false,
      organizationCreated: true
    });
    showFailure();

    expect(query('.setup-banner')).not.toBeNull();
    expect(query('.setup-banner__cta')?.textContent).toContain(i18n.translate('onboarding.banner.ctaResume'));

    dashboard.errorState.set(null);
    dashboard.loadingState.set(true);
    fixture.detectChanges();

    expect(query('.setup-banner')).not.toBeNull();
  });

  it('hides the onboarding banner when the wizard is completed even if the summary fails', () => {
    onboarding.progress.set({
      userId: 'user-1',
      wizardCompleted: true,
      wizardStep: 0,
      tourCompleted: true,
      tourStep: 0,
      createdTournament: true,
      organizationCreated: true
    });
    showFailure();

    expect(query('.setup-banner')).toBeNull();
    expect(query('[data-testid="dashboard-summary-error"]')).not.toBeNull();
  });

  it('shows plan usage only once the summary is loaded', () => {
    component.currentPlan.set(plan);
    fixture.detectChanges();

    expect(query('.usage-grid')).not.toBeNull();
  });

  it('should return 100 percent usage when current equals plan limit', () => {
    component.currentPlan.set(plan);

    expect(component.adminUsage().current).toBe(1);
    expect(component.adminUsage().max).toBe(1);
    expect(component.adminUsage().percent).toBe(100);

    expect(component.complexUsage().current).toBe(1);
    expect(component.complexUsage().max).toBe(1);
    expect(component.complexUsage().percent).toBe(100);
  });
});
