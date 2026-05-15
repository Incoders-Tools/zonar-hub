import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { Plan } from '../../../../core/models';
import { provideHttpClient } from '@angular/common/http';

class AdminDashboardServiceStub {
  readonly summary = signal({
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
  }).asReadonly();

  async loadSummary(_organizationId: string | null): Promise<void> {
    return Promise.resolve();
  }
}

describe('AdminDashboardPageComponent', () => {
  let component: AdminDashboardPageComponent;
  let fixture: ComponentFixture<AdminDashboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AdminDashboardService, useClass: AdminDashboardServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose computed signals', () => {
    expect(component.activeTournaments).toBeDefined();
    expect(component.showSetupPrompt).toBeDefined();
  });

  it('should return 100 percent usage when current equals plan limit', () => {
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

    component.currentPlan.set(plan);

    expect(component.adminUsage().current).toBe(1);
    expect(component.adminUsage().max).toBe(1);
    expect(component.adminUsage().percent).toBe(100);

    expect(component.complexUsage().current).toBe(1);
    expect(component.complexUsage().max).toBe(1);
    expect(component.complexUsage().percent).toBe(100);
  });
});
