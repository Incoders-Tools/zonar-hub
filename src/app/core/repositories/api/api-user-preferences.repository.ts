import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { extractApiErrorCode } from './api-error.util';

@Injectable({ providedIn: 'root' })
export class ApiUserPreferencesRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  async setPrimaryOrganization(organizationId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.put<void>(
        `${this.apiBaseUrl}/user-preferences/primary-organization`, { organizationId }
      ));
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'org.selector.primaryError'));
    }
  }
}
