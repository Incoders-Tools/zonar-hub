import { ImpersonationSession, ImpersonationTarget } from '../../core/impersonation/impersonation.model';

/**
 * Builds a typed ImpersonationTarget fixture for use in specs.
 * All fields can be overridden via the partial parameter.
 */
export function buildImpersonationTarget(overrides: Partial<ImpersonationTarget> = {}): ImpersonationTarget {
  return {
    id: 'target-user-001',
    fullName: 'Target User',
    email: 'target@zonarhub.dev',
    role: 'player',
    tenantId: 'tenant-abc',
    tenantName: 'Club Tenis ABC',
    ...overrides
  };
}

/**
 * Builds a typed ImpersonationSession fixture for use in specs.
 * By default the session expires 30 minutes from now (active).
 * Pass `expired: true` to get a session in the past.
 */
export function buildImpersonationSession(
  overrides: Partial<ImpersonationSession> & { expired?: boolean } = {}
): ImpersonationSession {
  const { expired, ...rest } = overrides;
  const expiresAt = expired
    ? new Date(Date.now() - 60_000).toISOString()          // 1 minute in the past
    : new Date(Date.now() + 30 * 60 * 1_000).toISOString(); // 30 minutes in the future

  return {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.imp.stub',
    expiresAt,
    sessionId: 'session-uuid-001',
    target: buildImpersonationTarget(),
    ...rest
  };
}
