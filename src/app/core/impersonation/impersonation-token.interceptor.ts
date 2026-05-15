/**
 * Helper functions for the impersonation token swap in authTokenInterceptor.
 *
 * Design §5.4: A separate file exists for unit-testability, but the logic
 * is consumed by the existing authTokenInterceptor — NOT added as a second
 * interceptor in the chain.
 */

import { ImpersonationService } from './impersonation.service';

/**
 * Returns the currently active Bearer token string.
 * If an impersonation session is active, returns the impersonation token.
 * Otherwise returns the real session token (or null if not authenticated).
 */
export function resolveActiveToken(
  imp: ImpersonationService,
  realToken: string | null | undefined
): string | null {
  return imp.token() ?? realToken ?? null;
}

/**
 * Returns the tenant ID to attach to X-Tenant-Id.
 * Uses the impersonated user's tenant when a session is active.
 */
export function resolveActiveTenantId(
  imp: ImpersonationService,
  realTenantId: string | null | undefined
): string | null {
  if (imp.active()) {
    return imp.target()?.tenantId ?? null;
  }
  return realTenantId ?? null;
}
