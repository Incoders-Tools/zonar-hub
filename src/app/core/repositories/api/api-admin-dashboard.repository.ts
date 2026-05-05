import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { AdminDashboardSummary } from '../../models';
import { AdminDashboardRepository } from '../admin-dashboard.repository';
import { extractApiErrorCode } from './api-error.util';

@Injectable({ providedIn: 'root' })
export class ApiAdminDashboardRepository implements AdminDashboardRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  async getSummary(organizationId: string): Promise<AdminDashboardSummary> {
    try {
      const endpoint = `${this.apiBaseUrl}/admin/dashboard/summary`;
      return await firstValueFrom(
        this.http.get<AdminDashboardSummary>(endpoint, { params: { organizationId } })
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }
}
