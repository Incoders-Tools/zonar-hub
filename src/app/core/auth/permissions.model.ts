/**
 * Permission model for Zonar Hub.
 *
 * Defines modules, tools, and default role-based access.
 * Supports per-user overrides managed by administrators.
 */

export type AppModule = 'dashboard' | 'circuit' | 'catalog' | 'system';

export interface ToolPermission {
  key: string;
  module: AppModule;
  labelKey: string;
  route?: string;
}

export interface UserPermissions {
  userId: string;
  allowedTools: string[];
}

export const SYSTEM_ADMIN_ONLY_TOOLS = [
  'roles',
  'actions',
  'audit',
  'app-logs',
  'security',
  'email-templates'
] as const;

/** All tools registered in the platform */
export const PLATFORM_TOOLS: ToolPermission[] = [
  // Dashboard
  { key: 'dashboard', module: 'dashboard', labelKey: 'admin.dashboard', route: '/admin' },

  // Circuit operations
  { key: 'tournaments', module: 'circuit', labelKey: 'admin.tournaments', route: '/admin/tournaments' },
  { key: 'tournament-eligibility-profiles', module: 'circuit', labelKey: 'admin.tournamentEligibilityProfiles', route: '/admin/catalogs/tournament-eligibility-profiles' },
  { key: 'tournament-rules', module: 'circuit', labelKey: 'admin.tournamentRuleSets', route: '/admin/catalogs/tournament-rules' },
  { key: 'registrations', module: 'circuit', labelKey: 'admin.registrations', route: '/admin/registrations' },
  { key: 'players', module: 'circuit', labelKey: 'admin.players', route: '/admin/players' },
  { key: 'teams', module: 'circuit', labelKey: 'admin.teams', route: '/admin/teams' },
  { key: 'draw-planner', module: 'circuit', labelKey: 'admin.drawPlanner', route: '/admin/draw-planner' },

  // Catalog
  { key: 'complexes', module: 'catalog', labelKey: 'admin.complexes', route: '/admin/catalogs/complexes' },
  { key: 'categories', module: 'catalog', labelKey: 'admin.categories', route: '/admin/catalogs/categories' },
  { key: 'genders', module: 'catalog', labelKey: 'admin.genders', route: '/admin/catalogs/genders' },
  { key: 'sports', module: 'catalog', labelKey: 'admin.sports', route: '/admin/catalogs/sports' },
  { key: 'tournament-statuses', module: 'catalog', labelKey: 'admin.tournamentStatuses', route: '/admin/catalogs/tournament-statuses' },
  { key: 'tournament-modalities', module: 'catalog', labelKey: 'admin.tournamentModalities', route: '/admin/catalogs/tournament-modalities' },
  { key: 'flyer-backgrounds', module: 'catalog', labelKey: 'admin.flyerBackgrounds', route: '/admin/flyer-backgrounds' },

  // System
  { key: 'users', module: 'system', labelKey: 'admin.users', route: '/admin/system/users' },
  { key: 'roles', module: 'system', labelKey: 'admin.roles', route: '/admin/system/roles' },
  { key: 'organizations', module: 'system', labelKey: 'admin.organizations', route: '/admin/system/organizations' },
  { key: 'plans', module: 'system', labelKey: 'admin.plans', route: '/admin/system/plans' },
  { key: 'actions', module: 'system', labelKey: 'admin.nav.actions', route: '/admin/system/actions' },
  { key: 'audit', module: 'system', labelKey: 'admin.audit', route: '/admin/system/audit' },
  { key: 'app-logs', module: 'system', labelKey: 'admin.appLogs', route: '/admin/system/logs' },
  { key: 'security', module: 'system', labelKey: 'admin.security', route: '/admin/system/security' },
  { key: 'settings', module: 'system', labelKey: 'admin.settings', route: '/admin/system/settings' },
  { key: 'email-templates', module: 'system', labelKey: 'admin.emailTemplates', route: '/admin/system/email-templates' },
  { key: 'billing', module: 'system', labelKey: 'admin.billing', route: '/admin/billing' },
];

/** Default tool permissions per role */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: PLATFORM_TOOLS.map(t => t.key),

  admin: [
    'dashboard',
    'tournaments', 'tournament-eligibility-profiles', 'tournament-rules',
    'registrations', 'players', 'teams', 'draw-planner',
    'complexes', 'categories', 'genders', 'sports', 'tournament-statuses', 'tournament-modalities',
    'users', 'organizations',
    'settings', 'flyer-backgrounds', 'billing', 'plans',
  ],

  editor: [
    'dashboard',
    'tournaments', 'tournament-eligibility-profiles', 'tournament-rules',
    'registrations', 'players', 'teams', 'draw-planner',
    'complexes', 'categories', 'genders', 'sports', 'tournament-statuses', 'tournament-modalities',
  ],

  user: [
    'dashboard',
    'tournaments', 'registrations', 'players', 'teams',
    'complexes',
  ],

  player: [
    'dashboard',
  ],

  viewer: [
    'dashboard',
  ],
};

export function getToolByKey(key: string): ToolPermission | undefined {
  return PLATFORM_TOOLS.find(t => t.key === key);
}

export function getToolsByModule(module: AppModule): ToolPermission[] {
  return PLATFORM_TOOLS.filter(t => t.module === module);
}
