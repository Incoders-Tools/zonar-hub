import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

interface ProblemDetailsPayload {
  code?: unknown;
}

/**
 * Network-level codes that the rest of the app can rely on. We promote them
 * to a stable shape so a feature-specific fallback (e.g. `auth.invalidCredentials`)
 * never masks a real connectivity problem — the user should be told that the
 * server is unreachable, not that their password is wrong.
 */
export const COMMON_NETWORK_UNAVAILABLE = 'common.networkUnavailable';
export const COMMON_REQUEST_TIMEOUT = 'common.requestTimeout';

export function extractApiErrorCode(
  error: unknown,
  fallback: string = 'common.unexpectedError'
): string {
  // RxJS timeout(...) operator surfaces this when the request never replies.
  if (error instanceof TimeoutError) {
    return COMMON_REQUEST_TIMEOUT;
  }

  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  // status === 0 → CORS error or network failure (server down, refused, etc.).
  // 502/503/504 → upstream gateway/proxy can't reach the API. Treat as network
  // failures so callers don't conflate them with business errors.
  if (
    error.status === 0
    || error.status === 502
    || error.status === 503
    || error.status === 504
  ) {
    return COMMON_NETWORK_UNAVAILABLE;
  }

  const payload = error.error as ProblemDetailsPayload | null | undefined;
  if (payload && typeof payload.code === 'string' && payload.code.trim().length > 0) {
    return payload.code;
  }

  if (error.status === 400) return 'common.validationFailed';
  if (error.status === 401) return 'common.unauthorized';
  if (error.status === 403) return 'common.forbidden';
  if (error.status === 404) return 'common.notFound';

  return fallback;
}
