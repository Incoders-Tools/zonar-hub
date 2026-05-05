import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentModality } from '../../models';
import { TournamentModalityRepository } from '../tournament-modality.repository';

interface ModalityApiDto {
  id: string;
  nameEs: string;
  nameEn: string;
  namePt: string;
  key: string;
  sortOrder: number;
  isActive: boolean;
}

interface ModalityListResponse {
  items: ModalityApiDto[];
}

@Injectable({ providedIn: 'root' })
export class ApiTournamentModalityRepository implements TournamentModalityRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/tournament-modalities`;
  }

  async getAll(): Promise<TournamentModality[]> {
    const response = await firstValueFrom(this.http.get<ModalityListResponse>(this.endpoint));
    return response.items.map(dto => this.toModel(dto));
  }

  async getById(id: string): Promise<TournamentModality | undefined> {
    const all = await this.getAll();
    return all.find(m => m.id === id);
  }

  async create(_modality: Omit<TournamentModality, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentModality> {
    throw new Error('Tournament modalities are managed by the system.');
  }

  async update(_id: string, _modality: Partial<TournamentModality>): Promise<TournamentModality> {
    throw new Error('Tournament modalities are managed by the system.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Tournament modalities are managed by the system.');
  }

  async getExistingKeys(): Promise<string[]> {
    const all = await this.getAll();
    return all.map(m => m.key);
  }

  private toModel(dto: ModalityApiDto): TournamentModality {
    const now = new Date().toISOString();
    return {
      id: dto.id,
      nameEs: dto.nameEs,
      nameEn: dto.nameEn,
      namePt: dto.namePt,
      key: dto.key,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      createdAt: now,
      updatedAt: now
    };
  }
}
