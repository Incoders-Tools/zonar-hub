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
  publicProfileEnabled?: boolean;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  whatsappPhone?: string | null;
  contactEmail?: string | null;
}

/**
 * Public-profile consent and links. The API PUT replaces all of them (an omitted link is
 * cleared), so every write sends the eight fields, with blank links as null.
 */
interface OrganizationPublicProfileRequest {
  publicProfileEnabled: boolean;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  whatsappPhone: string | null;
  contactEmail: string | null;
}

type OrganizationProfileLinkField = Exclude<keyof OrganizationPublicProfileRequest, 'publicProfileEnabled'>;

const PROFILE_LINK_FIELDS: readonly OrganizationProfileLinkField[] = [
  'websiteUrl', 'instagramUrl', 'facebookUrl', 'tiktokUrl', 'youtubeUrl', 'whatsappPhone', 'contactEmail'
];

const ORGANIZATION_ERROR_PREFIX = 'organizations.errors.';

interface OrganizationProblemPayload {
  detail?: unknown;
  errors?: Record<string, unknown>;
}

/**
 * Prefers the translatable `organizations.errors.*` key of an API problem: first a field message
 * of a validation problem, then the problem detail. Anything else keeps the shared mapping.
 */
function organizationErrorKey(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as OrganizationProblemPayload | null | undefined;
    const fieldMessages = Object.values(payload?.errors ?? {}).flatMap(messages => Array.isArray(messages) ? messages : []);
    const fieldKey = fieldMessages.find(
      (message): message is string => typeof message === 'string' && message.startsWith(ORGANIZATION_ERROR_PREFIX)
    );
    if (fieldKey) return fieldKey;
    if (typeof payload?.detail === 'string' && payload.detail.startsWith(ORGANIZATION_ERROR_PREFIX)) {
      return payload.detail;
    }
  }
  return extractApiErrorCode(error);
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

interface OrganizationWriteRequest extends OrganizationPublicProfileRequest {
  tenantId: string | null;
  displayName: string;
  legalName?: string;
  description?: string;
  type: string;
  logoUrl?: string;
  createdByUserId: string;
}

interface OrganizationUpdateRequest extends OrganizationPublicProfileRequest {
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
      throw new Error(organizationErrorKey(error));
    }
  }

  override async getById(id: string): Promise<Organization> {
    try {
      const row = await firstValueFrom(
        this.http.get<OrganizationApiDto>(`${this.endpoint}/${id}`)
      );
      return this.toModel(row);
    } catch (error) {
      throw new Error(organizationErrorKey(error));
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
      throw new Error(organizationErrorKey(error));
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
        createdByUserId: data.createdByUserId,
        ...this.toPublicProfileRequest(data)
      };

      const created = await firstValueFrom(
        this.http.post<OrganizationApiDto>(this.endpoint, request)
      );
      return this.toModel(created);
    } catch (error) {
      throw new Error(organizationErrorKey(error));
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
        isActive: changes.isActive ?? current.isActive,
        ...this.toPublicProfileRequest(this.mergePublicProfile(current, changes))
      };

      const updated = await firstValueFrom(
        this.http.put<OrganizationApiDto>(`${this.endpoint}/${id}`, request)
      );
      return this.toModel(updated);
    } catch (error) {
      throw new Error(organizationErrorKey(error));
    }
  }

  override async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint}/${id}`));
    } catch (error) {
      throw new Error(organizationErrorKey(error));
    }
  }

  override async deactivate(id: string): Promise<Organization> {
    return this.update(id, { isActive: false });
  }

  /** A field present in `changes` wins, even when blank (that clears it); absent fields keep the stored value. */
  private mergePublicProfile(
    current: Organization,
    changes: Partial<Organization>
  ): Partial<Organization> {
    const merged: Partial<Organization> = {
      publicProfileEnabled: changes.publicProfileEnabled ?? current.publicProfileEnabled
    };
    for (const field of PROFILE_LINK_FIELDS) {
      merged[field] = field in changes ? changes[field] : current[field];
    }
    return merged;
  }

  private toPublicProfileRequest(source: Partial<Organization>): OrganizationPublicProfileRequest {
    return {
      publicProfileEnabled: source.publicProfileEnabled ?? false,
      websiteUrl: blankToNull(source.websiteUrl),
      instagramUrl: blankToNull(source.instagramUrl),
      facebookUrl: blankToNull(source.facebookUrl),
      tiktokUrl: blankToNull(source.tiktokUrl),
      youtubeUrl: blankToNull(source.youtubeUrl),
      whatsappPhone: blankToNull(source.whatsappPhone),
      contactEmail: blankToNull(source.contactEmail)
    };
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
      updatedAt: dto.updatedAt,
      publicProfileEnabled: dto.publicProfileEnabled ?? false,
      websiteUrl: dto.websiteUrl ?? undefined,
      instagramUrl: dto.instagramUrl ?? undefined,
      facebookUrl: dto.facebookUrl ?? undefined,
      tiktokUrl: dto.tiktokUrl ?? undefined,
      youtubeUrl: dto.youtubeUrl ?? undefined,
      whatsappPhone: dto.whatsappPhone ?? undefined,
      contactEmail: dto.contactEmail ?? undefined
    };
  }
}
