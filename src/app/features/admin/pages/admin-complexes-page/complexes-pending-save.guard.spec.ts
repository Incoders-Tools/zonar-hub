import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { routes } from '../../../../app.routes';
import { AdminComplexesPageComponent } from './admin-complexes-page.component';
import { complexesPendingSaveGuard } from './complexes-pending-save.guard';

describe('complexesPendingSaveGuard', () => {
  it('registers the same guard on both complexes routes', () => {
    const admin = routes.find(route => route.path === 'admin');
    for (const path of ['complexes', 'catalogs/complexes']) {
      expect(admin?.children?.find(route => route.path === path)?.canDeactivate).toContain(complexesPendingSaveGuard);
    }
  });

  it('blocks while child save or facade save is pending, then permits leaving', () => {
    const childPending = signal(false);
    const saving = signal(false);
    const page = {
      showFormPanel: signal(true),
      formPanelSavePending: () => childPending(),
      facade: { saving }
    } as unknown as AdminComplexesPageComponent;
    const check = () => TestBed.runInInjectionContext(() => complexesPendingSaveGuard(
      page, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot
    ));
    expect(check()).toBeTrue();
    childPending.set(true);
    expect(check()).toBeFalse();
    childPending.set(false);
    saving.set(true);
    expect(check()).toBeFalse();
    saving.set(false);
    expect(check()).toBeTrue();
  });
});
