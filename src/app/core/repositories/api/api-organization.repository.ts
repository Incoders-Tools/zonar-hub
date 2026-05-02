import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Organization, OrganizationType } from '../../models';
import { OrganizationRepository } from '../organization.repository';
import { extractApiErrorCode } from './api-error.util';

interface OrganizationApiDto {
  id: string;
  tenantId: string;
  displayName: string;
  legalName?: string;
  description?: string;
  type: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string;
  updatedAt?: string;
}

interface OrganizationWriteRequest {
  tenantId: string | null;
  displayName: string;
  legalName?: string;
  description?: string;
  type: string;
  logoUrl?: string;
  createdByUserId: string;
}

interface OrganizationUpdateRequest {
  displayName: string;
  legalName?: string;
  description?: string;
  type: string;
  logoUrl?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiOrganizationRepository extends OrganizationRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/organizations`;
  }

  override async getAll(): Promise<Organization[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ items: OrganizationApiDto[] }>(this.endpoint)
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async getById(id: string): Promise<Organization> {
    try {
      const row = await firstValueFrom(
        this.http.get<OrganizationApiDto>(`${this.endpoint}/${id}`)
      );
      return this.toModel(row);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async getByTenantId(tenantId: string): Promise<Organization[]> {
    void tenantId;

    try {
      const response = await firstValueFrom(
        this.http.get<{ items: OrganizationApiDto[] }>(this.endpoint)
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async create(
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Organization> {
    try {
      const request: OrganizationWriteRequest = {
        tenantId: data.tenantId,
        displayName: data.displayName,
        legalName: data.legalName,
        description: data.description,
        type: data.type,
        logoUrl: data.logoUrl,
        createdByUserId: data.createdByUserId
      };

      const created = await firstValueFrom(
        this.http.post<OrganizationApiDto>(this.endpoint, request)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async update(
    id: string,
    changes: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Organization> {
    const current = await this.getById(id);

    try {
      const request: OrganizationUpdateRequest = {
        displayName: changes.displayName ?? current.displayName,
        legalName: changes.legalName ?? current.legalName,
        description: changes.description ?? current.description,
        type: changes.type ?? current.type,
        logoUrl: changes.logoUrl ?? current.logoUrl,
        isActive: changes.isActive ?? current.isActive
      };

      const updated = await firstValueFrom(
        this.http.put<OrganizationApiDto>(`${this.endpoint}/${id}`, request)
      );
      return this.toModel(updated);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${id}`));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  override async deactivate(id: string): Promise<Organization> {
    return this.update(id, { isActive: false });
  }

  private toModel(dto: OrganizationApiDto): Organization {
    return {
      id: dto.id,
      tenantId: dto.tenantId,
      displayName: dto.displayName,
      legalName: dto.legalName,
      description: dto.description,
      type: dto.type as OrganizationType,
      logoUrl: dto.logoUrl,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      createdByUserId: dto.createdByUserId,
      updatedAt: dto.updatedAt
    };
  }
}
