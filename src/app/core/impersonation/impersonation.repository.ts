import { ImpersonationHealthResponse, StartImpersonationRequest, StartImpersonationResponse } from './impersonation.model';

/**
 * Repository interface for impersonation API operations.
 * Follows the api-integration skill: no direct HttpClient usage in components;
 * implementations live in src/app/core/repositories/api/.
 */
export interface ImpersonationRepository {
  /**
   * Starts an impersonation session.
   * Calls POST /api/admin/impersonation/start.
   */
  start(request: StartImpersonationRequest): Promise<StartImpersonationResponse>;

  /**
   * Stops the current impersonation session.
   * Calls POST /api/admin/impersonation/stop (server reads imp_session_id from JWT).
   */
  stop(): Promise<void>;

  /**
   * Checks whether the impersonation feature is enabled.
   * Calls GET /api/admin/impersonation/health (anonymous-tolerant).
   */
  health(): Promise<ImpersonationHealthResponse>;
}

export const IMPERSONATION_REPOSITORY = 'ImpersonationRepository';
