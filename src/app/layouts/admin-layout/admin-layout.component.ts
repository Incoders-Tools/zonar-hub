import { Component, computed, inject, signal, OnInit, effect } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { OnboardingStateService } from '../../core/services/onboarding-state.service';
import { GuidedTourComponent, TourStep } from '../../shared/components/guided-tour/guided-tour.component';
import { ChatbotBubbleComponent } from '../../shared/components/chatbot-bubble/chatbot-bubble.component';

interface AdminNavItem {
  labelKey: string;
  route?: string;
  icon: string;
  toolKey?: string;
  children?: AdminNavItem[];
  isSubMenu?: boolean;
  expanded?: boolean;
}

interface AdminNavGroup {
  labelKey: string;
  icon: string;
  items: AdminNavItem[];
  expanded: boolean;
  module?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, GuidedTourComponent, ChatbotBubbleComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly permissions = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingStateService);
  private readonly userPrefs = inject(UserPreferencesService);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarOpen = signal(false);
  protected readonly showTour = signal(false);
  protected readonly showChatbot = computed(() => this.userPrefs.effective().showChatbot);

  constructor() {
    // Watch for tour state changes reactively (handles skip-onboarding → tour trigger)
    effect(() => {
      if (this.onboarding.needsTour() && !this.showTour()) {
        setTimeout(() => this.showTour.set(true), 600);
      }
    });
  }

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
      module: 'circuit',
      items: [
        {
          labelKey: 'admin.tournaments', route: '/admin/tournaments', icon: '🏆', toolKey: 'tournaments',
          expanded: false,
          children: [
            { labelKey: 'admin.tournamentTypes', route: '/admin/catalogs/tournament-types', icon: '🎾', toolKey: 'tournament-types' },
            { labelKey: 'admin.tournamentEligibilityProfiles', route: '/admin/catalogs/tournament-eligibility-profiles', icon: '✅', toolKey: 'tournament-eligibility-profiles' },
            { labelKey: 'admin.tournamentRuleSets', route: '/admin/catalogs/tournament-rules', icon: '📜', toolKey: 'tournament-rules' }
          ]
        },
        { labelKey: 'admin.registrations', route: '/admin/registrations', icon: '📝', toolKey: 'registrations' },
        { labelKey: 'admin.players', route: '/admin/players', icon: '👤', toolKey: 'players' },
        { labelKey: 'admin.drawPlanner', route: '/admin/draw-planner', icon: '🎯', toolKey: 'draw-planner' }
      ]
    },
    {
      labelKey: 'admin.nav.catalog',
      icon: '📋',
      expanded: false,
      module: 'catalog',
      items: [
        { labelKey: 'admin.complexes', route: '/admin/catalogs/complexes', icon: '🏟️', toolKey: 'complexes' },
        {
          labelKey: 'admin.nav.auxiliaryEntities',
          icon: '📂',
          isSubMenu: true,
          expanded: false,
          children: [
            { labelKey: 'admin.categories', route: '/admin/catalogs/categories', icon: '🏷️', toolKey: 'categories' },
            { labelKey: 'admin.genders', route: '/admin/catalogs/genders', icon: '⚧', toolKey: 'genders' },
            { labelKey: 'admin.sports', route: '/admin/catalogs/sports', icon: '🏅', toolKey: 'sports' },
            { labelKey: 'admin.complexServices', route: '/admin/catalogs/complex-services', icon: '🔧', toolKey: 'complex-services' },
            { labelKey: 'admin.socialNetworks', route: '/admin/catalogs/social-networks', icon: '📱', toolKey: 'social-networks' },
            { labelKey: 'admin.tournamentStatuses', route: '/admin/catalogs/tournament-statuses', icon: '📊', toolKey: 'tournament-statuses' }
          ]
        }
      ]
    },
    {
      labelKey: 'admin.nav.system',
      icon: '⚙️',
      expanded: false,
      module: 'system',
      items: [
        { labelKey: 'admin.users', route: '/admin/system/users', icon: '🔑', toolKey: 'users' },
        { labelKey: 'admin.roles', route: '/admin/system/roles', icon: '🛡️', toolKey: 'roles' },
        { labelKey: 'admin.tenants', route: '/admin/system/tenants', icon: '🏢', toolKey: 'tenants' },
        { labelKey: 'admin.organizations', route: '/admin/system/organizations', icon: '🏛️', toolKey: 'organizations' },
        { labelKey: 'admin.plans', route: '/admin/system/plans', icon: '💳', toolKey: 'plans' },
        { labelKey: 'admin.nav.actions', route: '/admin/system/actions', icon: '⚡', toolKey: 'actions' },
        { labelKey: 'admin.audit', route: '/admin/system/audit', icon: '📜', toolKey: 'audit' },
        { labelKey: 'admin.appLogs', route: '/admin/system/logs', icon: '📋', toolKey: 'app-logs' },
        { labelKey: 'admin.security', route: '/admin/system/security', icon: '🛡️', toolKey: 'security' },
        { labelKey: 'admin.settings', route: '/admin/system/settings', icon: '⚙️', toolKey: 'settings' },
        { labelKey: 'admin.billing', route: '/admin/billing', icon: '💰', toolKey: 'billing' },
        { labelKey: 'admin.flyerBackgrounds', route: '/admin/flyer-backgrounds', icon: '🖼️', toolKey: 'flyer-backgrounds' }
      ]
    }
  ];

  /** Nav groups filtered by current user's permissions */
  readonly filteredNavGroups = computed<AdminNavGroup[]>(() => {
    const allowed = new Set(this.permissions.allowedTools());
    return this.navGroups
      .map(group => {
        const filteredItems = group.items
          .map(item => {
            // Sub-menu: filter children
            if (item.isSubMenu && item.children) {
              const filteredChildren = item.children.filter(child =>
                !child.toolKey || allowed.has(child.toolKey)
              );
              if (filteredChildren.length === 0) return null;
              return { ...item, children: filteredChildren };
            }
            // Regular item with children
            if (item.children) {
              const filteredChildren = item.children.filter(child =>
                !child.toolKey || allowed.has(child.toolKey)
              );
              // Show parent if parent tool is allowed, even if no children
              if (item.toolKey && allowed.has(item.toolKey)) {
                return { ...item, children: filteredChildren };
              }
              return null;
            }
            // Simple item
            if (item.toolKey && !allowed.has(item.toolKey)) return null;
            return item;
          })
          .filter((item): item is AdminNavItem => item !== null);

        if (filteredItems.length === 0) return null;
        return { ...group, items: filteredItems };
      })
      .filter((group): group is AdminNavGroup => group !== null);
  });

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.userPrefs.applyEffectiveSettings();
      this.onboarding.loadExisting(user.id);
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

  toggleChatbot(): void {
    const current = this.userPrefs.effective().showChatbot;
    this.userPrefs.updateCurrentUserPrefs({ showChatbot: !current });
  }
}
