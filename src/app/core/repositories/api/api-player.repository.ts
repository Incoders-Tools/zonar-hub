import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { Player } from '../../models/player.model';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { PlayerPage, PlayerPageQuery, PlayerRepository, PlayerSearchFilters, PlayerWrite } from '../player.repository';
import { extractApiErrorCode } from './api-error.util';

interface PlayerApiDto {
  id: string;
  organizationId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  birthDate: string | null;
  genderId: string | null;
  categoryId: string | null;
  club: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlayerPageApiDto {
  items: PlayerApiDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

interface PlayerWriteRequest {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  birthDate: string | null;
  genderId: string | null;
  categoryId: string | null;
  club: string | null;
  isActive: boolean;
}

/** Problem codes of `docs/api/admin-registrations.md` (Players); each has a `players.errors.*` translation. */
const PLAYER_ERROR_CODES = new Set([
  'players.first_name_required', 'players.last_name_required', 'players.name_too_long', 'players.invalid_email',
  'players.field_too_long', 'players.birth_date_in_future', 'players.unknown_gender', 'players.unknown_category',
  'players.email_taken', 'players.document_taken', 'players.user_taken', 'players.not_found',
  'players.organization_id_required'
]);

/** Largest page the API serves; used to read every player in as few requests as possible. */
const MAX_PAGE_SIZE = 200;
const SEARCH_PAGE_SIZE = 20;

/**
 * Translation key of a failed player request: `players.<code>` becomes `players.errors.<code>`, the shared tenant
 * refusal becomes `common.forbidden`, network and status fallbacks stay `common.*`, anything else is generic.
 */
export function playerErrorKey(error: unknown): string {
  const code = extractApiErrorCode(error);
  if (PLAYER_ERROR_CODES.has(code)) return code.replace('players.', 'players.errors.');
  if (code === 'tournaments.forbidden') return 'common.forbidden';
  return code.startsWith('common.') ? code : 'common.unexpectedError';
}

/** Organization players (S3): `/api/admin/organizations/{activeOrganizationId}/players`. */
@Injectable({ providedIn: 'root' })
export class ApiPlayerRepository implements PlayerRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly activeOrg = inject(ActiveOrganizationService);

  private endpoint(organizationId: string): string {
    return `${this.apiBaseUrl}/admin/organizations/${organizationId}/players`;
  }

  async getAll(): Promise<Player[]> {
    const players: Player[] = [];
    for (let page = 1; ; page++) {
      const result = await this.fetchPage({ page, pageSize: MAX_PAGE_SIZE });
      players.push(...result.items.map(dto => this.toModel(dto)));
      if (!result.hasNextPage) return players;
    }
  }

  async getPage(query: PlayerPageQuery): Promise<PlayerPage> {
    const result = await this.fetchPage(query);
    return {
      items: result.items.map(dto => this.toModel(dto)),
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount
    };
  }

  async getById(id: string): Promise<Player | undefined> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) return undefined;
    try {
      const dto = await firstValueFrom(this.http.get<PlayerApiDto>(`${this.endpoint(organizationId)}/${id}`));
      return this.toModel(dto);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return undefined;
      throw new Error(playerErrorKey(error));
    }
  }

  /** First page of matching players; active only unless `filters.isActive` says otherwise. */
  async search(query: string, filters?: PlayerSearchFilters): Promise<Player[]> {
    const page = await this.getPage({
      page: 1,
      pageSize: SEARCH_PAGE_SIZE,
      search: query,
      isActive: filters?.isActive ?? true
    });
    return page.items;
  }

  async create(player: PlayerWrite): Promise<Player> {
    const organizationId = this.requireOrganization();
    try {
      const dto = await firstValueFrom(this.http.post<PlayerApiDto>(this.endpoint(organizationId), this.toRequest(player)));
      return this.toModel(dto);
    } catch (error) {
      throw new Error(playerErrorKey(error));
    }
  }

  /** The API replaces every editable field, so the changes are merged over the stored player. */
  async update(id: string, changes: Partial<PlayerWrite>): Promise<Player> {
    const organizationId = this.requireOrganization();
    const current = await this.getById(id);
    if (!current) throw new Error('players.errors.not_found');
    try {
      const dto = await firstValueFrom(
        this.http.put<PlayerApiDto>(`${this.endpoint(organizationId)}/${id}`, this.toRequest({ ...current, ...changes }))
      );
      return this.toModel(dto);
    } catch (error) {
      throw new Error(playerErrorKey(error));
    }
  }

  setActive(id: string, isActive: boolean): Promise<Player> {
    return this.update(id, { isActive });
  }

  /** The API has no habitual partner yet. */
  async getByHabitualPartner(_playerId: string): Promise<Player | undefined> {
    return undefined;
  }

  private async fetchPage(query: PlayerPageQuery): Promise<PlayerPageApiDto> {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) {
      return { items: [], page: query.page, pageSize: query.pageSize, totalCount: 0, hasNextPage: false };
    }
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    const search = query.search?.trim();
    if (search) params = params.set('search', search);
    if (query.isActive !== undefined) params = params.set('isActive', query.isActive);
    try {
      return await firstValueFrom(this.http.get<PlayerPageApiDto>(this.endpoint(organizationId), { params }));
    } catch (error) {
      throw new Error(playerErrorKey(error));
    }
  }

  private requireOrganization(): string {
    const organizationId = this.activeOrg.activeOrganizationId();
    if (!organizationId) throw new Error('players.errors.organization_id_required');
    return organizationId;
  }

  private toRequest(player: PlayerWrite): PlayerWriteRequest {
    return {
      firstName: player.firstName.trim(),
      lastName: player.lastName.trim(),
      email: blankToNull(player.email),
      phone: blankToNull(player.phone),
      documentId: blankToNull(player.documentId),
      birthDate: blankToNull(player.birthDate),
      genderId: blankToNull(player.genderId),
      categoryId: blankToNull(player.categoryId),
      club: blankToNull(player.club),
      isActive: player.isActive
    };
  }

  private toModel(dto: PlayerApiDto): Player {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      userId: dto.userId ?? undefined,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? '',
      phone: dto.phone ?? undefined,
      documentId: dto.documentId ?? undefined,
      birthDate: dto.birthDate ?? undefined,
      genderId: dto.genderId ?? '',
      genderLabel: '',
      categoryId: dto.categoryId ?? '',
      categoryName: '',
      club: dto.club ?? undefined,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
}

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
