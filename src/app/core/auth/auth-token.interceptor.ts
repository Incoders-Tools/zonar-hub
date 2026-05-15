import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { resolveActiveToken, resolveActiveTenantId } from '../impersonation/impersonation-token.interceptor';
import { AuthService } from './auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const imp = inject(ImpersonationService);

  const session = auth.session();
  const realToken = session?.token;

  // Resolve which token and tenant to use (impersonation takes priority).
  const token = resolveActiveToken(imp, realToken);
  const tenantId = resolveActiveTenantId(imp, session?.user?.tenantId);

  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    tap({
      error: (err: unknown) => {
        // On 401 while impersonating: force-stop the session.
        // The server has determined the impersonation token is invalid/revoked.
        if (err instanceof HttpErrorResponse && err.status === 401 && imp.active()) {
          imp.forceStop();
        }
      }
    })
  );
};
