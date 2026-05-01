import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const session = auth.session();
  const token = session?.token;

  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };

  const tenantId = session?.user?.tenantId;
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  return next(req.clone({ setHeaders: headers }));
};
