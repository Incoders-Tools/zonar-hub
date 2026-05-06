import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Complex, Court, Availability } from '../../models';
import { ComplexRepository } from '../complex.repository';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { ApiCourtRepository } from './api-court.repository';
import { extractApiErrorCode } from './api-error.util';

interface ComplexApiDto {
  id: string;
  organizationId: string;
  name: string;
  key: string | null;
  address: string;
  location: string | null;
  description: string | null;
  sortOrder: number;
  preponderance: number;
  logoImagePath: string | null;
  coverImagePath: string | null;
  layoutDiagramPath: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface CreateComplexRequest {
  organizationId: string;
  name: string;
  key: string | null;
  address: string;
  location: string | null;
  description: string | null;
  sortOrder: number;
  preponderance: number;
  logoImagePath: string | null;
  coverImagePath: string | null;
  layoutDiagramPath: string | null;
}

interface UpdateComplexRequest {
  name: string;
  key: string | null;
  address: string;
  location: string | null;
  description: string | null;
  sortOrder: number;
  preponderance: number;
  logoImagePath: string | null;
  coverImagePath: string | null;
  layoutDiagramPath: string | null;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiComplexRepository implements ComplexRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly courtRepository = inject(ApiCourtRepository);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/complexes`;
  }

  async getAll(): Promise<Complex[]> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) {
      return [];
    }
    return this.getForOrganization(organizationId);
  }

  async getForOrganization(organizationId: string): Promise<Complex[]> {
    try {
      const rows = await firstValueFrom(
        this.http.get<ComplexApiDto[]>(`${this.endpoint}?organizationId=${organizationId}`)
      );
      return rows.map(r => this.toModel(r));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<Complex | undefined> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) {
      return undefined;
    }
    try {
      const rows = await firstValueFrom(
        this.http.get<ComplexApiDto[]>(`${this.endpoint}?organizationId=${organizationId}`)
      );
      const found = rows.find(r => r.id === id);
      return found ? this.toModel(found) : undefined;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }
      throw new Error(extractApiErrorCode(error));
    }
  }

  async create(complex: Omit<Complex, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complex> {
    try {
      const organizationId = complex.organizationId || this.activeOrg.activeOrganizationId() || '';
      const request: CreateComplexRequest = {
        organizationId,
        name: complex.name,
        key: complex.key || null,
        address: complex.address,
        location: complex.location || null,
        description: complex.description || null,
        sortOrder: complex.sortOrder ?? 0,
        preponderance: complex.preponderance ?? 0,
        logoImagePath: complex.logoImagePath || null,
        coverImagePath: complex.coverImagePath || null,
        layoutDiagramPath: complex.layoutDiagramPath || null
      };

      const created = await firstValueFrom(
        this.http.post<ComplexApiDto>(this.endpoint, request)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<Complex>): Promise<Complex> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('common.notFound');
      }

      const request: UpdateComplexRequest = {
        name: changes.name ?? existing.name,
        key: this.normalizeOptional(changes.key ?? existing.key),
        address: changes.address ?? existing.address,
        location: this.normalizeOptional(changes.location ?? existing.location),
        description: this.normalizeOptional(changes.description ?? existing.description),
        sortOrder: changes.sortOrder ?? existing.sortOrder ?? 0,
        preponderance: changes.preponderance ?? existing.preponderance ?? 0,
        logoImagePath: this.normalizeOptional(changes.logoImagePath ?? existing.logoImagePath),
        coverImagePath: this.normalizeOptional(changes.coverImagePath ?? existing.coverImagePath),
        layoutDiagramPath: this.normalizeOptional(changes.layoutDiagramPath ?? existing.layoutDiagramPath),
        isActive: changes.isActive ?? existing.isActive
      };

      const updated = await firstValueFrom(
        this.http.put<ComplexApiDto>(`${this.endpoint}/${id}`, request)
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
    const complexes = await this.getAll();
    return complexes.map(c => c.key).filter((k): k is string => !!k);
  }

  // --- Courts (delegate to ApiCourtRepository) ---

  async getCourtsByComplexId(complexId: string): Promise<Court[]> {
    return this.courtRepository.getByComplexId(complexId);
  }

  async createCourt(court: Omit<Court, 'id'>): Promise<Court> {
    return this.courtRepository.create(court);
  }

  async updateCourt(id: string, court: Partial<Court>): Promise<Court> {
    return this.courtRepository.update(id, court);
  }

  async deleteCourt(id: string): Promise<void> {
    return this.courtRepository.delete(id);
  }

  // --- Availability (not yet implemented in API) ---

  async getAvailabilityByCourtId(_courtId: string): Promise<Availability[]> {
    return [];
  }

  async saveAvailability(
    _courtId: string,
    _slots: Omit<Availability, 'id' | 'courtId'>[]
  ): Promise<Availability[]> {
    return [];
  }

  private toModel(dto: ComplexApiDto): Complex {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      name: dto.name,
      key: dto.key ?? '',
      address: dto.address,
      location: dto.location ?? undefined,
      description: dto.description ?? undefined,
      sortOrder: dto.sortOrder,
      preponderance: dto.preponderance,
      logoImagePath: dto.logoImagePath ?? undefined,
      coverImagePath: dto.coverImagePath ?? undefined,
      layoutDiagramPath: dto.layoutDiagramPath ?? undefined,
      cityId: '',
      cityName: '',
      phone: undefined,
      email: undefined,
      imageUrl: undefined,
      sportsSupported: [],
      courtsCount: 0,
      isActive: dto.isActive,
      createdAt: dto.createdAtUtc,
      updatedAt: dto.updatedAtUtc
    };
  }

  private normalizeOptional(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
