import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { SocialNetwork } from '../../models';
import { SocialNetworkRepository } from '../social-network.repository';
import { extractApiErrorCode } from './api-error.util';

interface SocialNetworkApiDto {
  id: string;
  name: string;
  key: string;
  url: string | null;
  description: string | null;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialNetworkWriteRequest {
  name: string;
  key: string;
  url?: string | null;
  description?: string | null;
  faIcon?: string | null;
  sortOrder: number;
}

interface SocialNetworkUpdateRequest {
  name: string;
  url?: string | null;
  description?: string | null;
  faIcon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiSocialNetworkRepository implements SocialNetworkRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/social-networks`;
  }

  async getAll(): Promise<SocialNetwork[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ items: SocialNetworkApiDto[] }>(this.endpoint)
      );
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<SocialNetwork | undefined> {
    try {
      const row = await firstValueFrom(
        this.http.get<SocialNetworkApiDto>(`${this.endpoint}/${id}`)
      );
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(
    network: Omit<SocialNetwork, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SocialNetwork> {
    try {
      const request: SocialNetworkWriteRequest = {
        name: network.name,
        key: network.key,
        url: network.url,
        description: network.description,
        faIcon: network.faIcon,
        sortOrder: network.sortOrder ?? 0
      };

      const created = await firstValueFrom(
        this.http.post<SocialNetworkApiDto>(this.endpoint, request)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<SocialNetwork>): Promise<SocialNetwork> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: SocialNetworkUpdateRequest = {
        name: changes.name ?? current.name,
        url: changes.url ?? current.url,
        description: changes.description ?? current.description,
        faIcon: changes.faIcon ?? current.faIcon,
        sortOrder: changes.sortOrder ?? current.sortOrder ?? 0,
        isActive: changes.isActive ?? current.isActive
      };

      const updated = await firstValueFrom(
        this.http.put<SocialNetworkApiDto>(`${this.endpoint}/${id}`, request)
      );
      return this.toModel(updated);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${id}`));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getExistingKeys(): Promise<string[]> {
    const networks = await this.getAll();
    return networks.map(n => n.key);
  }

  private toModel(dto: SocialNetworkApiDto): SocialNetwork {
    return {
      id: dto.id,
      name: dto.name,
      key: dto.key,
      url: dto.url,
      description: dto.description,
      faIcon: dto.faIcon,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}
