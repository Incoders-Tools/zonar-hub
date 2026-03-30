import { Routes } from '@angular/router';
import { authGuard, adminGuard, playerGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  // ─── Public routes (with public layout) ───
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/pages/home-page/home-page.component').then(m => m.HomePageComponent)
      },
      {
        path: 'tournaments',
        loadComponent: () => import('./features/tournaments/pages/tournament-list-page/tournament-list-page.component').then(m => m.TournamentListPageComponent)
      },
      {
        path: 'tournaments/:id',
        loadComponent: () => import('./features/tournaments/pages/tournament-detail-page/tournament-detail-page.component').then(m => m.TournamentDetailPageComponent)
      },
      {
        path: 'tournaments/:id/register',
        loadComponent: () => import('./features/registration/pages/registration-wizard-page/registration-wizard-page.component').then(m => m.RegistrationWizardPageComponent)
      },
      {
        path: 'tournaments/:id/confirmed-pairs',
        loadComponent: () => import('./features/tournaments/pages/confirmed-pairs-page/confirmed-pairs-page.component').then(m => m.ConfirmedPairsPageComponent)
      },
      {
        path: 'tournaments/:id/draw',
        loadComponent: () => import('./features/tournaments/pages/public-draw-page/public-draw-page.component').then(m => m.PublicDrawPageComponent)
      },
      {
        path: 'privacy',
        loadComponent: () => import('./features/legal/pages/privacy-policy-page/privacy-policy-page.component').then(m => m.PrivacyPolicyPageComponent)
      },
      {
        path: 'terms',
        loadComponent: () => import('./features/legal/pages/terms-of-use-page/terms-of-use-page.component').then(m => m.TermsOfUsePageComponent)
      },
      {
        path: 'cookies',
        loadComponent: () => import('./features/legal/pages/cookie-policy-page/cookie-policy-page.component').then(m => m.CookiePolicyPageComponent)
      }
    ]
  },

  // ─── Auth routes (centered layout, guest-only) ───
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then(m => m.LoginPageComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register-page/register-page.component').then(m => m.RegisterPageComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/pages/forgot-password-page/forgot-password-page.component').then(m => m.ForgotPasswordPageComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/pages/reset-password-page/reset-password-page.component').then(m => m.ResetPasswordPageComponent)
      }
    ]
  },

  // ─── Player routes (auth required, player role) ───
  {
    path: 'player',
    loadComponent: () => import('./layouts/player-layout/player-layout.component').then(m => m.PlayerLayoutComponent),
    canActivate: [authGuard, playerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/player/pages/player-dashboard-page/player-dashboard-page.component').then(m => m.PlayerDashboardPageComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/player/pages/player-profile-page/player-profile-page.component').then(m => m.PlayerProfilePageComponent)
      },
      {
        path: 'registrations',
        loadComponent: () => import('./features/player/pages/player-registrations-page/player-registrations-page.component').then(m => m.PlayerRegistrationsPageComponent)
      }
    ]
  },

  // ─── Admin routes (auth required, admin role) ───
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/pages/admin-dashboard-page/admin-dashboard-page.component').then(m => m.AdminDashboardPageComponent)
      },
      {
        path: 'registrations',
        loadComponent: () => import('./features/admin/pages/admin-registrations-page/admin-registrations-page.component').then(m => m.AdminRegistrationsPageComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/pages/admin-users-page/admin-users-page.component').then(m => m.AdminUsersPageComponent)
      },
      {
        path: 'catalogs',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'complexes',
        loadComponent: () => import('./features/admin/pages/admin-complexes-page/admin-complexes-page.component').then(m => m.AdminComplexesPageComponent)
      },
      {
        path: 'catalogs/complexes',
        loadComponent: () => import('./features/admin/pages/admin-complexes-page/admin-complexes-page.component').then(m => m.AdminComplexesPageComponent)
      },
      {
        path: 'catalogs/categories',
        loadComponent: () => import('./features/admin/pages/admin-categories-page/admin-categories-page.component').then(m => m.AdminCategoriesPageComponent)
      },
      {
        path: 'catalogs/genders',
        loadComponent: () => import('./features/admin/pages/admin-genders-page/admin-genders-page.component').then(m => m.AdminGendersPageComponent)
      },
      {
        path: 'catalogs/complex-services',
        loadComponent: () => import('./features/admin/pages/admin-complex-services-page/admin-complex-services-page.component').then(m => m.AdminComplexServicesPageComponent)
      },
      {
        path: 'catalogs/social-networks',
        loadComponent: () => import('./features/admin/pages/admin-social-networks-page/admin-social-networks-page.component').then(m => m.AdminSocialNetworksPageComponent)
      },
      {
        path: 'catalogs/tournament-statuses',
        loadComponent: () => import('./features/admin/pages/admin-tournament-statuses-page/admin-tournament-statuses-page.component').then(m => m.AdminTournamentStatusesPageComponent)
      },
      {
        path: 'catalogs/tournament-types',
        loadComponent: () => import('./features/admin/pages/admin-tournament-types-page/admin-tournament-types-page.component').then(m => m.AdminTournamentTypesPageComponent)
      },
      {
        path: 'catalogs/tournament-eligibility-profiles',
        loadComponent: () => import('./features/admin/pages/admin-tournament-eligibility-profiles-page/admin-tournament-eligibility-profiles-page.component').then(m => m.AdminTournamentEligibilityProfilesPageComponent)
      },
      {
        path: 'catalogs/sports',
        loadComponent: () => import('./features/admin/pages/admin-sports-page/admin-sports-page.component').then(m => m.AdminSportsPageComponent)
      },
      {
        path: 'catalogs/tournament-rules',
        loadComponent: () => import('./features/admin/pages/admin-tournament-rules-page/admin-tournament-rules-page.component').then(m => m.AdminTournamentRulesPageComponent)
      },
      {
        path: 'draw-planner',
        loadComponent: () => import('./features/admin/pages/admin-draw-planner-page/admin-draw-planner-page.component').then(m => m.AdminDrawPlannerPageComponent)
      },
      {
        path: 'system/users',
        loadComponent: () => import('./features/admin/pages/admin-users-page/admin-users-page.component').then(m => m.AdminUsersPageComponent)
      },
      {
        path: 'system/roles',
        loadComponent: () => import('./features/admin/pages/admin-roles-page/admin-roles-page.component').then(m => m.AdminRolesPageComponent)
      },
      {
        path: 'system/actions',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'system/audit',
        loadComponent: () => import('./features/admin/pages/admin-audit-page/admin-audit-page.component').then(m => m.AdminAuditPageComponent)
      },
      {
        path: 'system/logs',
        loadComponent: () => import('./features/admin/pages/admin-app-logs-page/admin-app-logs-page.component').then(m => m.AdminAppLogsPageComponent)
      },
      {
        path: 'system/security',
        loadComponent: () => import('./features/admin/pages/admin-security-page/admin-security-page.component').then(m => m.AdminSecurityPageComponent)
      },
      {
        path: 'system/settings',
        loadComponent: () => import('./features/admin/pages/admin-settings-page/admin-settings-page.component').then(m => m.AdminSettingsPageComponent)
      },
      {
        path: 'audit',
        redirectTo: 'system/audit',
        pathMatch: 'full'
      },
      {
        path: 'security',
        redirectTo: 'system/security',
        pathMatch: 'full'
      }
    ]
  },

  // ─── Fallback ───
  { path: '**', redirectTo: '' }
];
