import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { tenantHeaderInterceptor } from './core/auth/tenant-header.interceptor';
import { ApiAdminUserRepository } from './core/repositories/api/api-admin-user.repository';
import { ApiSportRepository } from './core/repositories/api/api-sport.repository';
import { ApiTournamentStatusRepository } from './core/repositories/api/api-tournament-status.repository';
import { MockAdminUserRepository } from './core/repositories/mock/mock-admin-user.repository';
import { MockSportRepository } from './core/repositories/mock/mock-sport.repository';
import { MockTournamentStatusRepository } from './core/repositories/mock/mock-tournament-status.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authTokenInterceptor, tenantHeaderInterceptor])),
    provideAnimationsAsync(),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-rounded' } },
    { provide: MockAdminUserRepository, useExisting: ApiAdminUserRepository },
    { provide: MockSportRepository, useExisting: ApiSportRepository },
    { provide: MockTournamentStatusRepository, useExisting: ApiTournamentStatusRepository }
  ]
};
