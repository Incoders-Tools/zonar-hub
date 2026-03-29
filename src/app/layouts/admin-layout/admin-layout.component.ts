import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';

interface AdminNavItem {
  labelKey: string;
  route: string;
  icon: string;
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
        { labelKey: 'admin.tournaments', route: '/admin/tournaments', icon: '🏆' },
        { labelKey: 'admin.registrations', route: '/admin/registrations', icon: '📝' },
        { labelKey: 'admin.players', route: '/admin/players', icon: '👥' },
        { labelKey: 'admin.complexes', route: '/admin/complexes', icon: '🏟️' },
        { labelKey: 'admin.drawPlanner', route: '/admin/draw-planner', icon: '🎯' },
        { labelKey: 'admin.news', route: '/admin/news', icon: '📰' }
      ]
    },
    {
      labelKey: 'admin.nav.catalogs',
      icon: '📋',
      expanded: false,
      items: [
        { labelKey: 'admin.categories', route: '/admin/catalogs/categories', icon: '🏷️' },
        { labelKey: 'admin.genders', route: '/admin/catalogs/genders', icon: '⚧' },
        { labelKey: 'admin.cities', route: '/admin/catalogs/cities', icon: '🏙️' },
        { labelKey: 'admin.tournamentStatuses', route: '/admin/catalogs/tournament-statuses', icon: '📊' },
        { labelKey: 'admin.tournamentTypes', route: '/admin/catalogs/tournament-types', icon: '🎾' },
        { labelKey: 'admin.playerConditions', route: '/admin/catalogs/player-conditions', icon: '🩺' }
      ]
    },
    {
      labelKey: 'admin.nav.system',
      icon: '⚙️',
      expanded: false,
      items: [
        { labelKey: 'admin.users', route: '/admin/system/users', icon: '🔑' },
        { labelKey: 'admin.homeSections', route: '/admin/system/home-sections', icon: '🏠' },
        { labelKey: 'admin.roles', route: '/admin/system/roles', icon: '🛡️' },
        { labelKey: 'admin.nav.actions', route: '/admin/system/actions', icon: '⚡' },
        { labelKey: 'admin.audit', route: '/admin/system/audit', icon: '📜' },
        { labelKey: 'admin.processes', route: '/admin/system/processes', icon: '⚙️' },
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
}
