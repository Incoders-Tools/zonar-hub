import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantContext = inject(TenantContextService);
  const tenantId = tenantContext.tenantId();

  if (tenantId) {
    const cloned = req.clone({
      setHeaders: { 'X-Tenant-Id': tenantId }
    });
    return next(cloned);
  }

  return next(req);
};
