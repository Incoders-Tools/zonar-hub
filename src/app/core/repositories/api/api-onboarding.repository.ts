import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { extractApiErrorCode } from './api-error.util';

export interface OnboardingSystemSettingsRequest {
  locale: string;
  theme: string;
  timezone: string;
  dateFormat: string;
}

export interface OnboardingVenueRequest {
  name: string;
  address: string;
  location?: string | null;
  courtNames: string[];
}

export interface OnboardingTournamentRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CompleteOnboardingRequest {
  tenantId: string;
  createdByUserId: string;
  organizationDisplayName: string;
  organizationType: string;
  systemSettings?: OnboardingSystemSettingsRequest;
  venue?: OnboardingVenueRequest;
  enabledSportIds: string[];
  tournament?: OnboardingTournamentRequest | null;
}

export interface CompleteOnboardingResponse {
  organizationId: string;
  complexId?: string | null;
  courtIds: string[];
  enabledSportIds: string[];
  tournamentId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiOnboardingRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/onboarding/complete`;
  }

  async complete(request: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse> {
    try {
      return await firstValueFrom(
        this.http.post<CompleteOnboardingResponse>(this.endpoint, request)
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }
}
