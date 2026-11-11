import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { TournamentEligibilityProfile, TournamentEligibilitySlot } from '../../models/tournament-admin.model';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { EligibilityProfileRepository, EligibilityProfileWrite, EligibilitySlotWrite } from '../eligibility-profile.repository';
import { extractApiErrorCode } from './api-error.util';

interface EligibilityProfileApiDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  slots: EligibilitySlotWrite[];
  createdAt: string;
  updatedAt: string;
}

/** Problem codes of `docs/api/admin-registrations.md` (Eligibility profiles), translated as `eligibility_profiles.errors.*`. */
const PROFILE_ERROR_CODES = new Set([
  'eligibility_profiles.name_required', 'eligibility_profiles.name_too_long', 'eligibility_profiles.description_too_long',
  'eligibility_profiles.slots_required', 'eligibility_profiles.invalid_slot', 'eligibility_profiles.invalid_age_range',
  'eligibility_profiles.label_too_long', 'eligibility_profiles.unknown_gender', 'eligibility_profiles.unknown_category',
  'eligibility_profiles.name_taken', 'eligibility_profiles.in_use', 'eligibility_profiles.not_found',
  'eligibility_profiles.organization_id_required'
]);

/**
 * Translation key of a failed profile request: `eligibility_profiles.<code>` becomes `eligibility_profiles.errors.<code>`,
 * the shared tenant refusal becomes `common.forbidden`, `common.*` fallbacks stay, anything else is generic.
 */
export function eligibilityProfileErrorKey(error: unknown): string {
  const code = extractApiErrorCode(error);
  if (PROFILE_ERROR_CODES.has(code)) return code.replace('eligibility_profiles.', 'eligibility_profiles.errors.');
  if (code === 'tournaments.forbidden') return 'common.forbidden';
  return code.startsWith('common.') ? code : 'common.unexpectedError';
}

/** Organization eligibility profiles (D1, D5): `/api/admin/organizations/{activeOrganizationId}/eligibility-profiles`. */
@Injectable({ providedIn: 'root' })
export class ApiEligibilityProfileRepository implements EligibilityProfileRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly activeOrg = inject(ActiveOrganizationService);

  private endpoint(organizationId: string): string {
    return `${this.apiBaseUrl}/admin/organizations/${organizationId}/eligibility-profiles`;
  }

  async getAll(): Promise<TournamentEligibilityProfile[]> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) return [];
    try {
      const rows = await firstValueFrom(this.http.get<EligibilityProfileApiDto[]>(this.endpoint(organizationId)));
      return rows.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(eligibilityProfileErrorKey(error));
    }
  }

  async getById(id: string): Promise<TournamentEligibilityProfile | undefined> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) return undefined;
    try {
      const dto = await firstValueFrom(this.http.get<EligibilityProfileApiDto>(`${this.endpoint(organizationId)}/${id}`));
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return undefined;
      throw new Error(eligibilityProfileErrorKey(error));
    }
  }

  async create(profile: EligibilityProfileWrite): Promise<TournamentEligibilityProfile> {
    const organizationId = this.requireOrganization();
    try {
      const dto = await firstValueFrom(
        this.http.post<EligibilityProfileApiDto>(this.endpoint(organizationId), this.toRequest(profile))
      );
      return this.toModel(dto);
    } catch (error) {
      throw new Error(eligibilityProfileErrorKey(error));
    }
  }

  async update(id: string, profile: EligibilityProfileWrite): Promise<TournamentEligibilityProfile> {
    const organizationId = this.requireOrganization();
    try {
      const dto = await firstValueFrom(
        this.http.put<EligibilityProfileApiDto>(`${this.endpoint(organizationId)}/${id}`, this.toRequest(profile))
      );
      return this.toModel(dto);
    } catch (error) {
      throw new Error(eligibilityProfileErrorKey(error));
    }
  }

  async delete(id: string): Promise<void> {
    const organizationId = this.requireOrganization();
    try {
      await firstValueFrom(this.http.delete<void>(`${this.endpoint(organizationId)}/${id}`));
    } catch (error) {
      throw new Error(eligibilityProfileErrorKey(error));
    }
  }

  private requireOrganization(): string {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) throw new Error('eligibility_profiles.errors.organization_id_required');
    return organizationId;
  }

  private toRequest(profile: EligibilityProfileWrite): EligibilityProfileWrite {
    return {
      name: profile.name.trim(),
      description: blankToNull(profile.description),
      isActive: profile.isActive,
      slots: profile.slots.map(slot => ({
        slotNumber: slot.slotNumber,
        genderId: blankToNull(slot.genderId),
        categoryId: blankToNull(slot.categoryId),
        minAge: slot.minAge ?? null,
        maxAge: slot.maxAge ?? null,
        label: blankToNull(slot.label),
        required: slot.required
      }))
    };
  }

  /** The API has no key or sort order: profiles are ordered by name. */
  private toModel(dto: EligibilityProfileApiDto): TournamentEligibilityProfile {
    const slots: TournamentEligibilitySlot[] = [...dto.slots]
      .sort((a, b) => a.slotNumber - b.slotNumber)
      .map(slot => ({ ...slot, profileId: dto.id }));
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      name: dto.name,
      key: '',
      description: dto.description,
      sortOrder: null,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      slots
    };
  }
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
