import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Gender } from '../../models';
import { GenderRepository } from '../gender.repository';
import { extractApiErrorCode } from './api-error.util';

interface GenderApiDto {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface GenderWriteRequest {
  name: string;
  key: string;
  isActive: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class ApiGenderRepository implements GenderRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/catalog/genders`;
  }

  async getAll(): Promise<Gender[]> {
    try {
      const rows = await firstValueFrom(this.http.get<GenderApiDto[]>(this.endpoint));
      return rows.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Gender | undefined> {
    try {
      const row = await firstValueFrom(this.http.get<GenderApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(gender: Omit<Gender, 'id'>): Promise<Gender> {
    try {
      const request: GenderWriteRequest = {
        name: gender.name,
        key: gender.key,
        isActive: gender.isActive,
        sortOrder: gender.sortOrder
      };

      const created = await firstValueFrom(this.http.post<GenderApiDto>(this.endpoint, request));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<Gender>): Promise<Gender> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: GenderWriteRequest = {
        name: changes.name ?? current.name,
        key: changes.key ?? current.key,
        isActive: changes.isActive ?? current.isActive,
        sortOrder: changes.sortOrder ?? current.sortOrder
      };

      const updated = await firstValueFrom(this.http.put<GenderApiDto>(`${this.endpoint}/${id}`, request));
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
    const genders = await this.getAll();
    return genders.map(gender => gender.key);
  }

  private toModel(dto: GenderApiDto): Gender {
    return {
      id: dto.id,
      name: dto.name,
      key: dto.key,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}
