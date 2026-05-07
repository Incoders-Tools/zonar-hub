import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ApiOrganizationRepository } from '../repositories/api/api-organization.repository';
import { Organization, Tenant } from '../models';

const STORAGE_KEY = 'zh_active_organization_id';
const PRIMARY_ORG_KEY = 'zh_primary_organization_id';

/**
 * Centralized service for managing the active organization context.
 *
 * The active organization determines which data is displayed across the
 * entire admin experience. All facades and data access services should
 * filter results by the active organization.
 *
 * Terminology mapping:
 * - "organization" is the user-facing concept
 * - "tenant" is the internal data model (kept for backend compatibility)
 */
@Injectable({ providedIn: 'root' })
export class ActiveOrganizationService {
  private readonly auth = inject(AuthService);
  private readonly organizationRepo = inject(ApiOrganizationRepository);
  private loadRequestId = 0;
  private readonly organizationTenantById = new Map<string, string>();

  /** All organizations (tenants) in the system */
  private readonly allOrganizations = signal<Tenant[]>([]);

  /** The ID of the currently active organization */
  private readonly activeOrgIdState = signal<string | null>(null);

  /** The user's primary organization ID (persisted) */
  private readonly primaryOrgIdState = signal<string | null>(null);

  /** Organizations the current user can manage (active only) */
  readonly manageableOrganizations = computed<Tenant[]>(() => {
    const user = this.auth.currentUser();
    const all = this.allOrganizations();
    if (!user) return [];

    if (user.role === 'system_admin') {
      return all.filter(t => t.isActive);
    }

    const assigned = new Set(user.tenantIds ?? []);
    if (user.organizationId) {
      assigned.add(user.organizationId);
    }

    if (assigned.size === 0) {
      return [];
    }

    return all.filter(t => t.isActive && assigned.has(t.id));
  });

  /** The currently active organization (full object) */
  readonly activeOrganization = computed<Tenant | null>(() => {
    const id = this.activeOrgIdState();
    if (!id) return null;
    return this.manageableOrganizations().find(t => t.id === id) ?? null;
  });

  /** The active organization ID (for filtering data) */
  readonly activeOrganizationId = computed<string | null>(() => this.activeOrgIdState());

  /** The active organization name (for display) */
  readonly activeOrganizationName = computed<string>(() => this.activeOrganization()?.name ?? '');

  /** Whether an active organization is set */
  readonly hasActiveOrganization = computed<boolean>(() => this.activeOrgIdState() !== null);

  /** Signal that increments whenever organization changes (for triggering reloads) */
  private readonly organizationChangeCounter = signal(0);

  /** Read-only counter for components to detect organization changes */
  readonly organizationChanged = this.organizationChangeCounter.asReadonly();

  /** True while a switch is in progress so the shell can display a loader */
  private readonly switchingState = signal(false);
  readonly isSwitching = this.switchingState.asReadonly();

  /** Configurable settle window for the post-switch overlay (ms). */
  private static readonly SWITCH_SETTLE_MS = 700;

  /** The user's primary organization ID */
  readonly primaryOrganizationId = this.primaryOrgIdState.asReadonly();

  /** Whether there are multiple manageable organizations (show selector) */
  readonly hasMultipleOrganizations = computed<boolean>(() => this.manageableOrganizations().length > 1);

  /** Whether the user is a sysadmin */
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  constructor() {
    // When auth state changes, reload organizations and restore active selection
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        void this.loadOrganizations();
      } else {
        this.loadRequestId += 1;
        this.organizationTenantById.clear();
        this.allOrganizations.set([]);
        this.activeOrgIdState.set(null);
        this.primaryOrgIdState.set(null);
      }
    });
  }

  /** Load organizations and set initial active org */
  private async loadOrganizations(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const currentLoadId = ++this.loadRequestId;

    try {
      const organizations = user.tenantId
        ? await this.organizationRepo.getByTenantId(user.tenantId)
        : await this.organizationRepo.getAll();

      if (currentLoadId !== this.loadRequestId) {
        return;
      }

      this.organizationTenantById.clear();
      for (const organization of organizations) {
        this.organizationTenantById.set(organization.id, organization.tenantId);
      }

      this.allOrganizations.set(organizations.map(org => this.toTenant(org)));
    } catch {
      if (currentLoadId !== this.loadRequestId) {
        return;
      }

      this.organizationTenantById.clear();
      this.allOrganizations.set([]);
    }

    const currentUser = this.auth.currentUser();
    if (!currentUser) return;

    // Restore primary org
    const storedPrimary = this.getStoredPrimaryOrgId(currentUser.id);
    this.primaryOrgIdState.set(storedPrimary);

    // Determine active org: stored selection → primary → first manageable
    const currentActive = this.activeOrgIdState();
    const storedActive = this.getStoredActiveOrgId(currentUser.id);
    const all = this.allOrganizations();
    const manageable = new Set(this.manageableOrganizations().map(org => org.id));

    if (currentUser.organizationId && manageable.has(currentUser.organizationId)) {
      this.activeOrgIdState.set(currentUser.organizationId);
    } else if (currentActive && manageable.has(currentActive)) {
      this.activeOrgIdState.set(currentActive);
    } else if (storedActive && manageable.has(storedActive)) {
      this.activeOrgIdState.set(storedActive);
    } else if (storedPrimary && manageable.has(storedPrimary)) {
      this.activeOrgIdState.set(storedPrimary);
    } else {
      // Fall back to first manageable active org
      const firstActive = all.find(t => t.isActive && manageable.has(t.id));
      this.activeOrgIdState.set(firstActive?.id ?? null);
    }

    this.syncTenantContext(this.activeOrgIdState());
  }

  /** Switch the active organization */
  switchOrganization(orgId: string): void {
    const manageable = this.manageableOrganizations();
    const exists = manageable.some(o => o.id === orgId);
    if (!exists) return;

    const previousOrgId = this.activeOrgIdState();
    if (previousOrgId === orgId) return;

    const org = manageable.find(o => o.id === orgId);

    this.switchingState.set(true);

    this.activeOrgIdState.set(orgId);
    this.persistActiveOrgId(orgId);
    this.syncTenantContext(orgId);

    // Sync with auth session so OrganizationContextService gets the update
    if (org) {
      this.auth.updateCurrentOrganization(orgId, org.name);
    }

    // Notify components that organization has changed
    this.organizationChangeCounter.update(count => count + 1);

    // Give downstream facades a deterministic settle window before clearing
    // the overlay so users see the transition rather than a flicker.
    setTimeout(() => {
      this.switchingState.set(false);
    }, ActiveOrganizationService.SWITCH_SETTLE_MS);
  }

  /** Set the user's primary organization */
  setPrimaryOrganization(orgId: string): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.primaryOrgIdState.set(orgId);
    this.persistPrimaryOrgId(user.id, orgId);
  }

  /** Refresh the list of organizations (after CRUD operations) */
  refreshOrganizations(): void {
    void this.loadOrganizations();
  }

  /** Set a new org as active and primary (used during onboarding) */
  setOnboardingOrganization(orgId: string): void {
    const user = this.auth.currentUser();
    this.activeOrgIdState.set(orgId);
    this.syncTenantContext(orgId);
    this.primaryOrgIdState.set(orgId);
    if (user) {
      this.persistActiveOrgId(orgId);
      this.persistPrimaryOrgId(user.id, orgId);
    }
    this.refreshOrganizations();
  }

  // ---- Private helpers ----

  private toTenant(org: Organization): Tenant {
    const sessionTenant = this.auth.session()?.tenant;
    const email = sessionTenant?.contactEmail ?? this.auth.currentUser()?.email ?? '';

    return {
      id: org.id,
      name: org.displayName,
      key: this.toKey(org.displayName),
      contactEmail: email,
      planId: sessionTenant?.planId ?? 'plan-1',
      planType: sessionTenant?.planType ?? 'starter',
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    };
  }

  private toKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_');
  }

  private persistActiveOrgId(orgId: string): void {
    try {
      const user = this.auth.currentUser();
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, orgId);
      }
    } catch { /* storage unavailable */ }
  }

  private getStoredActiveOrgId(userId: string): string | null {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    } catch { return null; }
  }

  private persistPrimaryOrgId(userId: string, orgId: string): void {
    try {
      localStorage.setItem(`${PRIMARY_ORG_KEY}_${userId}`, orgId);
    } catch { /* storage unavailable */ }
  }

  private getStoredPrimaryOrgId(userId: string): string | null {
    try {
      return localStorage.getItem(`${PRIMARY_ORG_KEY}_${userId}`);
    } catch { return null; }
  }

  private syncTenantContext(organizationId: string | null): void {
    if (!organizationId) {
      this.auth.updateTenantContext(this.auth.currentUser()?.tenantId ?? this.auth.session()?.tenant?.id ?? null);
      return;
    }

    const tenantId = this.organizationTenantById.get(organizationId)
      ?? this.auth.currentUser()?.tenantId
      ?? this.auth.session()?.tenant?.id
      ?? null;

    this.auth.updateTenantContext(tenantId);
  }
}
