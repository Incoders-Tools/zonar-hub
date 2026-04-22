import { Injectable, inject, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PLATFORM_TOOLS,
  ToolPermission,
  UserPermissions,
  AppModule,
  getToolsByModule,
} from './permissions.model';

const STORAGE_KEY = 'zh_user_permissions';

/**
 * Centralized permission resolution service.
 *
 * Resolves effective tool access for the current user by merging:
 * 1. Default permissions for the user's role
 * 2. Per-user overrides stored by administrators
 *
 * Provides computed signals for use in guards, directives, and templates.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);

  /** Per-user permission overrides (admin-managed) */
  private readonly overrides = signal<UserPermissions[]>(this.loadOverrides());

  /** Effective tool keys the current user has access to.
   *
   * Role defaults act as the minimum baseline. Per-user overrides are merged
   * additively so that tools added to a role's defaults are always visible,
   * even for users who had an override saved before the new tool was introduced.
   */
  readonly allowedTools = computed<string[]>(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    const role = user.role;
    const roleDefaults = new Set(DEFAULT_ROLE_PERMISSIONS[role] ?? []);

    const override = this.overrides().find(o => o.userId === user.id);
    if (override) {
      // Merge: role defaults are always included; override adds extra tools
      const merged = new Set([...roleDefaults, ...override.allowedTools]);
      return Array.from(merged);
    }

    // No override — use role defaults
    return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  });

  /** All platform tools the current user has access to */
  readonly allowedToolDefinitions = computed<ToolPermission[]>(() => {
    const keys = new Set(this.allowedTools());
    return PLATFORM_TOOLS.filter(t => keys.has(t.key));
  });

  /** Whether the current user has access to a specific tool */
  hasTool(toolKey: string): boolean {
    return this.allowedTools().includes(toolKey);
  }

  /** Computed signal for checking a specific tool */
  hasToolSignal(toolKey: string) {
    return computed(() => this.allowedTools().includes(toolKey));
  }

  /** Whether the current user has access to any tool in a module */
  hasModule(module: AppModule): boolean {
    const moduleTools = getToolsByModule(module);
    const allowed = new Set(this.allowedTools());
    return moduleTools.some(t => allowed.has(t.key));
  }

  /** Computed signal for checking module-level access */
  hasModuleSignal(module: AppModule) {
    return computed(() => {
      const moduleTools = getToolsByModule(module);
      const allowed = new Set(this.allowedTools());
      return moduleTools.some(t => allowed.has(t.key));
    });
  }

  /** Whether the current user can share entities on social networks */
  readonly canShare = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    // All authenticated users with at least dashboard access can share
    return this.allowedTools().length > 0;
  });

  /** Update per-user permission overrides (admin action) */
  setUserPermissions(userId: string, allowedTools: string[]): void {
    const current = [...this.overrides()];
    const existingIdx = current.findIndex(o => o.userId === userId);
    if (existingIdx >= 0) {
      current[existingIdx] = { userId, allowedTools };
    } else {
      current.push({ userId, allowedTools });
    }
    this.overrides.set(current);
    this.persistOverrides(current);
  }

  /** Remove per-user override (revert to role defaults) */
  removeUserOverride(userId: string): void {
    const updated = this.overrides().filter(o => o.userId !== userId);
    this.overrides.set(updated);
    this.persistOverrides(updated);
  }

  /** Get permissions for a specific user (for admin management) */
  getUserPermissions(userId: string): UserPermissions | null {
    return this.overrides().find(o => o.userId === userId) ?? null;
  }

  /** Get the allowed tools visible within a given module */
  getModuleTools(module: AppModule): ToolPermission[] {
    const allowed = new Set(this.allowedTools());
    return getToolsByModule(module).filter(t => allowed.has(t.key));
  }

  private persistOverrides(data: UserPermissions[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage unavailable */ }
  }

  private loadOverrides(): UserPermissions[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
