import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { tenantHeaderInterceptor } from './core/auth/tenant-header.interceptor';
import { ApiFileStorageRepository } from './core/repositories/api/api-file-storage.repository';
import { FILE_STORAGE_REPOSITORY } from './core/repositories/file-storage.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authTokenInterceptor, tenantHeaderInterceptor])),
    provideAnimationsAsync(),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-rounded' } },
    { provide: FILE_STORAGE_REPOSITORY, useExisting: ApiFileStorageRepository }
  ]
};
