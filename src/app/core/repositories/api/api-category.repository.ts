import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Category } from '../../models';
import { CategoryRepository } from '../category.repository';
import { extractApiErrorCode } from './api-error.util';

interface CategoryApiDto {
  id: string;
  name: string;
  shortName: string;
  key: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryWriteRequest {
  name: string;
  shortName: string;
  key: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class ApiCategoryRepository implements CategoryRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/catalog/categories`;
  }

  async getAll(): Promise<Category[]> {
    try {
      const rows = await firstValueFrom(this.http.get<CategoryApiDto[]>(this.endpoint));
      return rows.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Category | undefined> {
    try {
      const row = await firstValueFrom(this.http.get<CategoryApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const request: CategoryWriteRequest = {
        name: category.name,
        shortName: category.shortName,
        key: category.key,
        level: category.level,
        isActive: category.isActive,
        sortOrder: category.sortOrder
      };

      const created = await firstValueFrom(this.http.post<CategoryApiDto>(this.endpoint, request));
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<Category>): Promise<Category> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: CategoryWriteRequest = {
        name: changes.name ?? current.name,
        shortName: changes.shortName ?? current.shortName,
        key: changes.key ?? current.key,
        level: changes.level ?? current.level,
        isActive: changes.isActive ?? current.isActive,
        sortOrder: changes.sortOrder ?? current.sortOrder
      };

      const updated = await firstValueFrom(this.http.put<CategoryApiDto>(`${this.endpoint}/${id}`, request));
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
    const categories = await this.getAll();
    return categories.map(category => category.key);
  }

  private toModel(dto: CategoryApiDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      shortName: dto.shortName,
      key: dto.key,
      level: dto.level,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}
