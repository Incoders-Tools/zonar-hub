import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAdmin()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }
  return router.createUrlTree(['/login']);
};

/**
 * Guard that allows admin OR user role to access admin layout.
 * Fine-grained tool access is enforced by toolGuard per route.
 */
export const adminOrUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.userRole();
  if (role === 'system_admin' || role === 'admin' || role === 'user') {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }
  return router.createUrlTree(['/login']);
};

/**
 * Guard that checks tool-level permission.
 * Expects route data: { toolKey: 'some-tool-key' }
 */
export const toolGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissions = inject(PermissionService);
  const router = inject(Router);
  const toolKey = route.data?.['toolKey'] as string | undefined;

  if (!toolKey) return true;
  if (permissions.hasTool(toolKey)) return true;

  return router.createUrlTree(['/admin']);
};

/**
 * Guard that ensures only system_admin can access a route.
 */
export const systemAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isSystemAdmin()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/login']);
};

export const playerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isPlayer()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  const role = auth.userRole();
  if (role === 'system_admin' || role === 'admin' || role === 'user') {
    return router.createUrlTree(['/admin']);
  }
  if (role === 'player') {
    return router.createUrlTree(['/player']);
  }
  return router.createUrlTree(['/']);
};
