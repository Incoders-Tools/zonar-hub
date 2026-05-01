/**
 * Utility for persisting mock repository data to localStorage.
 *
 * Follows the repository `zh_` prefix convention.
 * Tenant-aware repos include the tenantId in the key.
 * Global repos (catalogs) use a simple key.
 */

const PREFIX = 'zh_mock_';
const TENANT_SESSION_KEY = 'zh_auth_session_tenant';

export function getCurrentMockTenantId(): string | null {
  try { return localStorage.getItem(TENANT_SESSION_KEY); } catch { return null; }
}

export function isDemoTenant(): boolean {
  const id = getCurrentMockTenantId();
  return id === null || id === 'tenant-1';
}

/** Build a tenant-scoped localStorage key. */
export function tenantStorageKey(collection: string): string {
  const tid = getCurrentMockTenantId() ?? 'default';
  return `${PREFIX}${collection}_${tid}`;
}

/** Build a global (non-tenant) localStorage key. */
export function globalStorageKey(collection: string): string {
  return `${PREFIX}${collection}`;
}

/** Save data to localStorage under the given key. */
export function persistToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* storage unavailable or quota exceeded */ }
}

/** Load data from localStorage. Returns null if not found or on error. */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove a key from localStorage. */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}
