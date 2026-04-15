/**
 * Shared mock utility for tenant-aware data isolation.
 *
 * Demo tenant (tenant-1) gets pre-seeded mock data.
 * Newly registered tenants start with empty collections.
 */

const SESSION_KEY = 'zh_auth_session_tenant';

export function setCurrentMockTenant(tenantId: string | undefined): void {
  try {
    if (tenantId) {
      localStorage.setItem(SESSION_KEY, tenantId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch { /* storage unavailable */ }
}

export function getCurrentMockTenantId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns true if the current session belongs to the pre-seeded demo tenant.
 * Repositories should return mock data only for the demo tenant.
 * All other tenants start with empty collections.
 */
export function isDemoTenant(): boolean {
  const tenantId = getCurrentMockTenantId();
  return tenantId === null || tenantId === 'tenant-1';
}
