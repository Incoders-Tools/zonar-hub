import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';

class AdminDashboardServiceStub {
  readonly summary = signal({
    organizationId: 'org-1',
    totalTournaments: 3,
    activeTournaments: 2,
    finishedTournaments: 1,
    totalPlayers: 8,
    totalRegistrations: 4,
    complexCount: 2,
    courtCount: 5,
    adminCount: 2,
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
});
