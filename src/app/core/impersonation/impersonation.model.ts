/**
 * Domain models for the user-impersonation feature.
 * Design reference: §5.1, §5.2, backend endpoint shapes in apply-progress Batch 2.
 */

/** The target user's identity as returned by the backend start endpoint. */
export interface ImpersonationTarget {
  id: string;
  fullName: string;
  email: string;
  role: string;
  tenantId: string;
  /** Optional tenant display name resolved client-side or passed by the UI. */
  tenantName?: string;
}

/** The full impersonation session kept in-memory and mirrored to sessionStorage. */
export interface ImpersonationSession {
  /** JWT impersonation token (Bearer value). */
  token: string;
  /** Token expiry in ISO-8601. */
  expiresAt: string;
  /** Backend session UUID (`imp_session_id` claim). */
  sessionId: string;
  /** Effective (target) user identity. */
  target: ImpersonationTarget;
}

/** Request body for POST /api/admin/impersonation/start */
export interface StartImpersonationRequest {
  userId: string;
  reason?: string;
}

/** Response body from POST /api/admin/impersonation/start */
export interface StartImpersonationResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  sessionId: string;
  target: ImpersonationTarget;
}

/** Response body from GET /api/admin/impersonation/health */
export interface ImpersonationHealthResponse {
  enabled: boolean;
}
