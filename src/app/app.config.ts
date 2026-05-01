import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { tenantHeaderInterceptor } from './core/auth/tenant-header.interceptor';
import { ApiCategoryRepository } from './core/repositories/api/api-category.repository';
import { ApiGenderRepository } from './core/repositories/api/api-gender.repository';
import { ApiSportRepository } from './core/repositories/api/api-sport.repository';
import { ApiTournamentAdminRepository } from './core/repositories/api/api-tournament-admin.repository';
import { MockCategoryRepository } from './core/repositories/mock/mock-category.repository';
import { MockGenderRepository } from './core/repositories/mock/mock-gender.repository';
import { MockSportRepository } from './core/repositories/mock/mock-sport.repository';
import { MockTournamentAdminRepository } from './core/repositories/mock/mock-tournament-admin.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authTokenInterceptor, tenantHeaderInterceptor])),
    provideAnimationsAsync(),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-rounded' } },
    { provide: MockSportRepository, useExisting: ApiSportRepository },
    { provide: MockGenderRepository, useExisting: ApiGenderRepository },
    { provide: MockCategoryRepository, useExisting: ApiCategoryRepository },
    { provide: MockTournamentAdminRepository, useExisting: ApiTournamentAdminRepository }
  ]
};
