import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';
import { OnboardingStateService } from '../../core/services/onboarding-state.service';
import { GuidedTourComponent, TourStep } from '../../shared/components/guided-tour/guided-tour.component';

interface AdminNavItem {
  labelKey: string;
  route?: string;
  icon: string;
  children?: AdminNavItem[];
  isSubMenu?: boolean;
  expanded?: boolean;
}

interface AdminNavGroup {
  labelKey: string;
  icon: string;
  items: AdminNavItem[];
  expanded: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, GuidedTourComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingStateService);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarOpen = signal(false);
  protected readonly showTour = signal(false);

  readonly tourSteps: TourStep[] = [
    { targetSelector: '.admin-sidebar__link[href="/admin"]', titleKey: 'tour.dashboard.title', descriptionKey: 'tour.dashboard.description', position: 'right' },
    { targetSelector: '.admin-sidebar__group:first-of-type', titleKey: 'tour.circuitOps.title', descriptionKey: 'tour.circuitOps.description', position: 'right' },
    { targetSelector: '.admin-sidebar__user', titleKey: 'tour.profile.title', descriptionKey: 'tour.profile.description', position: 'top' },
    { targetSelector: '.admin-main', titleKey: 'tour.mainArea.title', descriptionKey: 'tour.mainArea.description', position: 'left' }
  ];

  protected readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || '??';
  });

  readonly dashboardItem: AdminNavItem = {
    labelKey: 'admin.dashboard', route: '/admin', icon: '📊'
  };

  readonly navGroups: AdminNavGroup[] = [
    {
      labelKey: 'admin.nav.circuitOps',
      icon: '🏆',
      expanded: true,
      items: [
        {
          labelKey: 'admin.tournaments', route: '/admin/tournaments', icon: '🏆',
          expanded: false,
          children: [
            { labelKey: 'admin.tournamentTypes', route: '/admin/catalogs/tournament-types', icon: '🎾' },
            { labelKey: 'admin.tournamentEligibilityProfiles', route: '/admin/catalogs/tournament-eligibility-profiles', icon: '✅' },
            { labelKey: 'admin.tournamentRuleSets', route: '/admin/catalogs/tournament-rules', icon: '📜' }
          ]
        },
        { labelKey: 'admin.registrations', route: '/admin/registrations', icon: '📝' },
        { labelKey: 'admin.players', route: '/admin/players', icon: '👤' },
        { labelKey: 'admin.drawPlanner', route: '/admin/draw-planner', icon: '🎯' }
      ]
    },
    {
      labelKey: 'admin.nav.catalog',
      icon: '📋',
      expanded: false,
      items: [
        { labelKey: 'admin.complexes', route: '/admin/catalogs/complexes', icon: '🏟️' },
        {
          labelKey: 'admin.nav.auxiliaryEntities',
          icon: '📂',
          isSubMenu: true,
          expanded: false,
          children: [
            { labelKey: 'admin.categories', route: '/admin/catalogs/categories', icon: '🏷️' },
            { labelKey: 'admin.genders', route: '/admin/catalogs/genders', icon: '⚧' },
            { labelKey: 'admin.sports', route: '/admin/catalogs/sports', icon: '🏅' },
            { labelKey: 'admin.complexServices', route: '/admin/catalogs/complex-services', icon: '🔧' },
            { labelKey: 'admin.socialNetworks', route: '/admin/catalogs/social-networks', icon: '📱' },
            { labelKey: 'admin.tournamentStatuses', route: '/admin/catalogs/tournament-statuses', icon: '📊' }
          ]
        }
      ]
    },
    {
      labelKey: 'admin.nav.system',
      icon: '⚙️',
      expanded: false,
      items: [
        { labelKey: 'admin.users', route: '/admin/system/users', icon: '🔑' },
        { labelKey: 'admin.roles', route: '/admin/system/roles', icon: '🛡️' },
        { labelKey: 'admin.tenants', route: '/admin/system/tenants', icon: '🏢' },
        { labelKey: 'admin.plans', route: '/admin/system/plans', icon: '💳' },
        { labelKey: 'admin.nav.actions', route: '/admin/system/actions', icon: '⚡' },
        { labelKey: 'admin.audit', route: '/admin/system/audit', icon: '📜' },
        { labelKey: 'admin.appLogs', route: '/admin/system/logs', icon: '📋' },

        { labelKey: 'admin.security', route: '/admin/system/security', icon: '🛡️' },
        { labelKey: 'admin.settings', route: '/admin/system/settings', icon: '⚙️' },
        { labelKey: 'admin.billing', route: '/admin/billing', icon: '💰' },
        { labelKey: 'admin.flyerBackgrounds', route: '/admin/flyer-backgrounds', icon: '🖼️' }
      ]
    }
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.onboarding.loadExisting(user.id);
      if (this.onboarding.needsTour()) {
        setTimeout(() => this.showTour.set(true), 600);
      }
    }
  }

  onTourCompleted(): void {
    this.onboarding.completeTour();
    this.showTour.set(false);
  }

  onTourCancelled(): void {
    this.onboarding.skipTour();
    this.showTour.set(false);
  }

  toggleGroup(group: AdminNavGroup): void {
    group.expanded = !group.expanded;
  }

  toggleItemChildren(item: AdminNavItem): void {
    item.expanded = !item.expanded;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
