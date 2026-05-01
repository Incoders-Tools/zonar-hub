import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetailsPayload {
  code?: unknown;
}

export function extractApiErrorCode(
  error: unknown,
  fallback: string = 'common.unexpectedError'
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
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
