import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Court } from '../../models';
import { CourtRepository } from '../court.repository';
import { API_BASE_URL } from '../../config/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ApiCourtRepository implements CourtRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/courts`;
  }

  async getAll(): Promise<Court[]> {
    return firstValueFrom(this.http.get<Court[]>(this.endpoint));
  }

  async getById(id: string): Promise<Court | undefined> {
    try {
      return await firstValueFrom(this.http.get<Court>(`${this.endpoint}/${id}`));
    } catch {
      return undefined;
    }
  }

  async getByComplexId(complexId: string): Promise<Court[]> {
    return firstValueFrom(this.http.get<Court[]>(`${this.endpoint}/complex/${complexId}`));
  }

  async create(court: Omit<Court, 'id'>): Promise<Court> {
    const response = await firstValueFrom(
      this.http.post<string>(this.endpoint, {
        complexId: court.complexId,
        name: court.name
      })
    );
    
    // Backend returns the ID as GUID string, construct full court object
    return {
      id: response,
      complexId: court.complexId,
      name: court.name,
      isActive: true
    };
  }

  async update(id: string, changes: Partial<Court>): Promise<Court> {
    await firstValueFrom(
      this.http.put(`${this.endpoint}/${id}`, {
        name: changes.name,
        isActive: changes.isActive ?? true
      })
    );
    
    // Return updated court (refetch to ensure consistency)
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('Court not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${id}`));
  }
}
