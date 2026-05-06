import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { tenantHeaderInterceptor } from './core/auth/tenant-header.interceptor';
import { ApiAdminUserRepository } from './core/repositories/api/api-admin-user.repository';
import { ApiCategoryRepository } from './core/repositories/api/api-category.repository';
import { ApiComplexRepository } from './core/repositories/api/api-complex.repository';
import { ApiGenderRepository } from './core/repositories/api/api-gender.repository';
import { ApiSportRepository } from './core/repositories/api/api-sport.repository';
import { ApiRoleRepository } from './core/repositories/api/api-role.repository';
import { ApiTournamentStatusRepository } from './core/repositories/api/api-tournament-status.repository';
import { ApiTournamentModalityRepository } from './core/repositories/api/api-tournament-modality.repository';
import { MockAdminUserRepository } from './core/repositories/mock/mock-admin-user.repository';
import { MockCategoryRepository } from './core/repositories/mock/mock-category.repository';
import { MockComplexRepository } from './core/repositories/mock/mock-complex.repository';
import { MockGenderRepository } from './core/repositories/mock/mock-gender.repository';
import { MockRoleRepository } from './core/repositories/mock/mock-role.repository';
import { MockSportRepository } from './core/repositories/mock/mock-sport.repository';
import { MockTournamentStatusRepository } from './core/repositories/mock/mock-tournament-status.repository';
import { MockTournamentModalityRepository } from './core/repositories/mock/mock-tournament-modality.repository';
import { MockFileStorageRepository } from './core/repositories/mock/mock-file-storage.repository';
import { FILE_STORAGE_REPOSITORY } from './core/repositories/file-storage.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authTokenInterceptor, tenantHeaderInterceptor])),
    provideAnimationsAsync(),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-rounded' } },
    { provide: MockAdminUserRepository, useExisting: ApiAdminUserRepository },
    { provide: MockSportRepository, useExisting: ApiSportRepository },
    { provide: MockTournamentStatusRepository, useExisting: ApiTournamentStatusRepository },
    { provide: MockTournamentModalityRepository, useExisting: ApiTournamentModalityRepository },
    { provide: MockComplexRepository, useExisting: ApiComplexRepository },
    { provide: MockGenderRepository, useExisting: ApiGenderRepository },
    { provide: MockCategoryRepository, useExisting: ApiCategoryRepository },
    { provide: MockRoleRepository, useExisting: ApiRoleRepository },
    // File storage — swap MockFileStorageRepository for ApiFileStorageRepository when the API endpoint is ready
    { provide: FILE_STORAGE_REPOSITORY, useExisting: MockFileStorageRepository }
  ]
};
