import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarOpen = signal(false);

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
          expanded: true,
          children: [
            { labelKey: 'admin.tournamentTypes', route: '/admin/catalogs/tournament-types', icon: '🎾' },
            { labelKey: 'admin.tournamentEligibilityProfiles', route: '/admin/catalogs/tournament-eligibility-profiles', icon: '✅' },
            { labelKey: 'admin.tournamentRuleSets', route: '/admin/catalogs/tournament-rules', icon: '📜' }
          ]
        },
        { labelKey: 'admin.registrations', route: '/admin/registrations', icon: '📝' },
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
        { labelKey: 'admin.nav.actions', route: '/admin/system/actions', icon: '⚡' },
        { labelKey: 'admin.audit', route: '/admin/system/audit', icon: '📜' },
        { labelKey: 'admin.appLogs', route: '/admin/system/logs', icon: '📋' },

        { labelKey: 'admin.security', route: '/admin/system/security', icon: '🛡️' },
        { labelKey: 'admin.settings', route: '/admin/system/settings', icon: '⚙️' }
      ]
    }
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
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
