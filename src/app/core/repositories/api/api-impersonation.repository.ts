import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import {
  ImpersonationHealthResponse,
  StartImpersonationRequest,
  StartImpersonationResponse
} from '../../impersonation/impersonation.model';
import { ImpersonationRepository } from '../../impersonation/impersonation.repository';
import { ImpersonationService } from '../../impersonation/impersonation.service';
import { extractApiErrorCode } from './api-error.util';

@Injectable({ providedIn: 'root' })
export class ApiImpersonationRepository implements ImpersonationRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  constructor() {
    // Self-register as the ImpersonationService's repository.
    // This breaks the circular DI risk: ImpersonationService has no constructor
    // dependency on ApiImpersonationRepository; instead, ApiImpersonationRepository
    // pushes itself in after it is created.
    inject(ImpersonationService).setRepository(this);
  }

  private get baseEndpoint(): string {
    return `${this.apiBaseUrl}/admin/impersonation`;
  }

  async start(request: StartImpersonationRequest): Promise<StartImpersonationResponse> {
    try {
      return await firstValueFrom(
        this.http.post<StartImpersonationResponse>(`${this.baseEndpoint}/start`, request)
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async stop(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`${this.baseEndpoint}/stop`, {})
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async health(): Promise<ImpersonationHealthResponse> {
    try {
      return await firstValueFrom(
        this.http.get<ImpersonationHealthResponse>(`${this.baseEndpoint}/health`)
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }
}
