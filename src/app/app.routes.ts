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
        path: 'tournaments',
        loadComponent: () => import('./features/admin/pages/admin-tournaments-page/admin-tournaments-page.component').then(m => m.AdminTournamentsPageComponent)
      },
      {
        path: 'tournaments/new',
        loadComponent: () => import('./features/admin/pages/admin-tournament-form-page/admin-tournament-form-page.component').then(m => m.AdminTournamentFormPageComponent)
      },
      {
        path: 'tournaments/:id',
        loadComponent: () => import('./features/admin/pages/admin-tournament-form-page/admin-tournament-form-page.component').then(m => m.AdminTournamentFormPageComponent)
      },
      {
        path: 'registrations',
        loadComponent: () => import('./features/admin/pages/admin-registrations-page/admin-registrations-page.component').then(m => m.AdminRegistrationsPageComponent)
      },
      {
        path: 'players',
        loadComponent: () => import('./features/admin/pages/admin-players-page/admin-players-page.component').then(m => m.AdminPlayersPageComponent)
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
        redirectTo: '/admin/complexes',
        pathMatch: 'full'
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
        path: 'catalogs/cities',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'catalogs/tournament-statuses',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'catalogs/tournament-types',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'catalogs/player-conditions',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
      },
      {
        path: 'draw-planner',
        loadComponent: () => import('./features/admin/pages/admin-draw-planner-page/admin-draw-planner-page.component').then(m => m.AdminDrawPlannerPageComponent)
      },
      {
        path: 'news',
        loadComponent: () => import('./features/admin/pages/admin-news-page/admin-news-page.component').then(m => m.AdminNewsPageComponent)
      },
      {
        path: 'home-sections',
        loadComponent: () => import('./features/admin/pages/admin-home-sections-page/admin-home-sections-page.component').then(m => m.AdminHomeSectionsPageComponent)
      },
      {
        path: 'system/users',
        loadComponent: () => import('./features/admin/pages/admin-users-page/admin-users-page.component').then(m => m.AdminUsersPageComponent)
      },
      {
        path: 'system/home-sections',
        loadComponent: () => import('./features/admin/pages/admin-home-sections-page/admin-home-sections-page.component').then(m => m.AdminHomeSectionsPageComponent)
      },
      {
        path: 'system/roles',
        loadComponent: () => import('./features/admin/pages/admin-catalogs-page/admin-catalogs-page.component').then(m => m.AdminCatalogsPageComponent)
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
        path: 'system/processes',
        loadComponent: () => import('./features/admin/pages/admin-processes-page/admin-processes-page.component').then(m => m.AdminProcessesPageComponent)
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
        path: 'processes',
        redirectTo: 'system/processes',
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
