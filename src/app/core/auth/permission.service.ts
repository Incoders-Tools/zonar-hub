import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ActiveOrganizationService } from '../services/active-organization.service';
import { ApiPermissionRepository } from '../repositories/api/api-permission.repository';
import { PermissionModule, PermissionTool } from '../models';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PLATFORM_TOOLS,
  ToolPermission,
  AppModule,
  SYSTEM_ADMIN_ONLY_TOOLS,
} from './permissions.model';

/**
 * Centralized permission resolution service backed by the API.
 *
 * Effective permissions are resolved by active organization so guards,
 * menu visibility, and directives react to organization switches.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly auth = inject(AuthService);
  private readonly activeOrganization = inject(ActiveOrganizationService);
  private readonly repository = inject(ApiPermissionRepository);

  private readonly catalogState = signal<PermissionModule[]>([]);
  private readonly allowedToolsState = signal<string[]>([]);
  private readonly isLoadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);

  private loadingPromise: Promise<void> | null = null;
  private loadedScopeKey: string | null = null;

  readonly permissionCatalog = this.catalogState.asReadonly();
  readonly loading = this.isLoadingState.asReadonly();
  readonly error = this.loadErrorState.asReadonly();

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const activeOrganizationId = this.activeOrganization.activeOrganizationId() ?? user?.organizationId ?? null;

      if (!user) {
        this.catalogState.set([]);
        this.allowedToolsState.set([]);
        this.loadedScopeKey = null;
        this.loadingPromise = null;
        return;
      }

      void this.ensureLoaded(activeOrganizationId);
    });
  }

  async ensureLoaded(organizationId?: string | null): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      this.catalogState.set([]);
      this.allowedToolsState.set([]);
      this.loadedScopeKey = null;
      return;
    }

    const scopeKey = `${user.id}:${organizationId ?? ''}`;
    if (this.loadedScopeKey === scopeKey && this.catalogState().length > 0) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadFromApi(scopeKey, organizationId ?? undefined)
      .finally(() => {
        this.loadingPromise = null;
      });

    return this.loadingPromise;
  }

  /** Effective tool keys for the active user + organization scope. */
  readonly allowedTools = computed<string[]>(() => {
    return this.allowedToolsState();
  });

  /** All platform tools the current user has access to */
  readonly allowedToolDefinitions = computed<ToolPermission[]>(() => {
    const keys = new Set(this.allowedTools());
    const dynamic = this.catalogState();

    if (dynamic.length > 0) {
      return dynamic
        .flatMap(module => module.tools)
        .filter(tool => keys.has(tool.key))
        .map(tool => ({
          key: tool.key,
          module: tool.moduleKey as AppModule,
          labelKey: tool.labelKey,
          route: tool.route
        }));
    }

    return PLATFORM_TOOLS.filter(tool => keys.has(tool.key));
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
  hasModule(module: string): boolean {
    const moduleTools = this.getToolsForModule(module);
    const allowed = new Set(this.allowedTools());
    return moduleTools.some(tool => allowed.has(tool.key));
  }

  /** Computed signal for checking module-level access */
  hasModuleSignal(module: string) {
    return computed(() => {
      const moduleTools = this.getToolsForModule(module);
      const allowed = new Set(this.allowedTools());
      return moduleTools.some(tool => allowed.has(tool.key));
    });
  }

  /** Whether the current user can share entities on social networks */
  readonly canShare = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    // All authenticated users with at least dashboard access can share
    return this.allowedTools().length > 0;
  });

  /** Get the allowed tools visible within a given module */
  getModuleTools(module: string): ToolPermission[] {
    const allowed = new Set(this.allowedTools());
    return this.getToolsForModule(module)
      .filter(tool => allowed.has(tool.key))
      .map(tool => ({
        key: tool.key,
        module: tool.moduleKey as AppModule,
        labelKey: tool.labelKey,
        route: tool.route
      }));
  }

  private async loadFromApi(scopeKey: string, organizationId?: string): Promise<void> {
    this.isLoadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const [catalog, effective] = await Promise.all([
        this.repository.getCatalog(),
        this.repository.getEffectivePermissions(organizationId)
      ]);

      this.catalogState.set(this.normalizeCatalog(catalog.modules));
      this.allowedToolsState.set(this.normalizeTools(effective.toolKeys));
      this.loadedScopeKey = scopeKey;
    } catch {
      // Fallback for local/dev scenarios where permission endpoints are not reachable.
      const user = this.auth.currentUser();
      const roleDefaults = user ? [...(DEFAULT_ROLE_PERMISSIONS[user.role] ?? [])] : [];
      this.catalogState.set(this.buildFallbackCatalog());
      this.allowedToolsState.set(this.normalizeTools(roleDefaults));
      this.loadedScopeKey = scopeKey;
      this.loadErrorState.set('permissions.loadError');
    } finally {
      this.isLoadingState.set(false);
    }
  }

  private getToolsForModule(module: string): PermissionTool[] {
    const dynamic = this.catalogState();
    if (dynamic.length > 0) {
      return dynamic
        .find(group => group.key === module)
        ?.tools ?? [];
    }

    return PLATFORM_TOOLS
      .filter(tool => tool.module === module)
      .map(tool => ({
        key: tool.key,
        moduleKey: tool.module,
        labelKey: tool.labelKey,
        route: tool.route,
        sortOrder: 0,
        isSystemAdminOnly: SYSTEM_ADMIN_ONLY_TOOLS.includes(tool.key as typeof SYSTEM_ADMIN_ONLY_TOOLS[number]),
        isActive: true
      }));
  }

  private normalizeCatalog(modules: PermissionModule[]): PermissionModule[] {
    return modules
      .filter(module => module.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(module => ({
        ...module,
        tools: module.tools
          .filter(tool => tool.isActive)
          .sort((left, right) => left.sortOrder - right.sortOrder)
      }));
  }

  private normalizeTools(tools: string[]): string[] {
    return [...new Set(tools.map(tool => tool.trim().toLowerCase()))];
  }

  private buildFallbackCatalog(): PermissionModule[] {
    const groups = new Map<string, PermissionModule>();

    for (const tool of PLATFORM_TOOLS) {
      const existing = groups.get(tool.module);
      const normalizedTool: PermissionTool = {
        key: tool.key,
        moduleKey: tool.module,
        labelKey: tool.labelKey,
        route: tool.route,
        sortOrder: 0,
        isSystemAdminOnly: SYSTEM_ADMIN_ONLY_TOOLS.includes(tool.key as typeof SYSTEM_ADMIN_ONLY_TOOLS[number]),
        isActive: true
      };

      if (existing) {
        existing.tools = [...existing.tools, normalizedTool];
      } else {
        groups.set(tool.module, {
          key: tool.module,
          labelKey: `admin.permissions.module.${tool.module}`,
          sortOrder: 0,
          isActive: true,
          tools: [normalizedTool]
        });
      }
    }

    return [...groups.values()];
  }
}
