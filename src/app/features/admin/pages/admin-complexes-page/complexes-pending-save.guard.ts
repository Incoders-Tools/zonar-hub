import { CanDeactivateFn } from '@angular/router';
import type { AdminComplexesPageComponent } from './admin-complexes-page.component';

export const complexesPendingSaveGuard: CanDeactivateFn<AdminComplexesPageComponent> = page =>
  !page.formPanelSavePending() && !page.facade.saving();
