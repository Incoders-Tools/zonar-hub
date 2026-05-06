import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';
import { AuthService } from './auth.service';

export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantContext = inject(TenantContextService);
  const auth = inject(AuthService);
  const tenantId = tenantContext.tenantId();
  const organizationId = auth.session()?.organizationId ?? auth.currentUser()?.organizationId;

  const setHeaders: Record<string, string> = {};

  if (tenantId) {
    setHeaders['X-Tenant-Id'] = tenantId;
  }

  if (organizationId) {
    setHeaders['X-Organization-Id'] = organizationId;
  }

  if (Object.keys(setHeaders).length > 0) {
    const cloned = req.clone({
      setHeaders
    });
    return next(cloned);
  }

  return next(req);
};
