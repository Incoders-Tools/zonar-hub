import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { ApiPlayerRepository } from './api-player.repository';

const playersUrl = '/api/admin/organizations/org-1/players';

const dto = {
  id: 'p-1', organizationId: 'org-1', userId: null, firstName: 'Ana', lastName: 'Gil', displayName: 'Ana Gil',
  email: 'ana@club.test', phone: null, documentId: '30111222', birthDate: '1990-05-20', genderId: 'g-f',
  categoryId: 'c-4', club: 'Norte', isActive: true, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-02T10:00:00Z'
};

const page = (items: unknown[], overrides: Record<string, unknown> = {}) => ({
  items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false, ...overrides
});

const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('ApiPlayerRepository', () => {
  let repository: ApiPlayerRepository;
  let http: HttpTestingController;
  const activeOrganizationId = signal<string | null>('org-1');

  beforeEach(() => {
    activeOrganizationId.set('org-1');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ActiveOrganizationService, useValue: { activeOrganizationId } }
      ]
    });
    repository = TestBed.inject(ApiPlayerRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('getPage', () => {
    it('requests the organization players with search, isActive and paging and maps the page', async () => {
      const result = repository.getPage({ page: 2, pageSize: 25, search: 'gil', isActive: false });
      const request = http.expectOne(r => r.url === playersUrl);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('search')).toBe('gil');
      expect(request.request.params.get('isActive')).toBe('false');
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('25');
      request.flush(page([dto], { page: 2, pageSize: 25, totalCount: 26 }));

      const mapped = await result;
      expect(mapped.page).toBe(2);
      expect(mapped.totalCount).toBe(26);
      expect(mapped.items[0]).toEqual(jasmine.objectContaining({
        id: 'p-1', organizationId: 'org-1', firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test',
        documentId: '30111222', birthDate: '1990-05-20', genderId: 'g-f', categoryId: 'c-4', club: 'Norte',
        isActive: true, createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-02T10:00:00Z'
      }));
    });

    it('omits blank search and unset isActive from the query', async () => {
      const result = repository.getPage({ page: 1, pageSize: 20, search: '   ' });
      const request = http.expectOne(r => r.url === playersUrl);
      expect(request.request.params.has('search')).toBe(false);
      expect(request.request.params.has('isActive')).toBe(false);
      request.flush(page([]));
      await result;
    });

    it('maps missing optional data to empty values that the eligibility rules treat as missing', async () => {
      const result = repository.getPage({ page: 1, pageSize: 20 });
      http.expectOne(r => r.url === playersUrl).flush(page([{
        ...dto, email: null, documentId: null, birthDate: null, genderId: null, categoryId: null, club: null
      }]));
      const player = (await result).items[0];
      expect(player.email).toBe('');
      expect(player.genderId).toBe('');
      expect(player.categoryId).toBe('');
      expect(player.birthDate).toBeUndefined();
      expect(player.documentId).toBeUndefined();
      expect(player.club).toBeUndefined();
    });

    it('returns an empty page without a request when no organization is active', async () => {
      activeOrganizationId.set(null);
      const result = await repository.getPage({ page: 1, pageSize: 20 });
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      http.expectNone(() => true);
    });

    it('maps the tenant refusal to the shared forbidden key', async () => {
      const result = repository.getPage({ page: 1, pageSize: 20 });
      http.expectOne(r => r.url === playersUrl)
        .flush({ code: 'tournaments.forbidden' }, { status: 403, statusText: 'Forbidden' });
      await expectAsync(result).toBeRejectedWithError('common.forbidden');
    });
  });

  it('search asks the API for active players by default and returns the items', async () => {
    const result = repository.search('ana');
    const request = http.expectOne(r => r.url === playersUrl);
    expect(request.request.params.get('search')).toBe('ana');
    expect(request.request.params.get('isActive')).toBe('true');
    request.flush(page([dto]));
    expect((await result).map(p => p.id)).toEqual(['p-1']);
  });

  it('getAll reads every page up to the last one', async () => {
    const result = repository.getAll();
    const first = http.expectOne(r => r.url === playersUrl && r.params.get('page') === '1');
    expect(first.request.params.get('pageSize')).toBe('200');
    first.flush(page([dto], { hasNextPage: true, totalPages: 2 }));
    await settle();
    http.expectOne(r => r.url === playersUrl && r.params.get('page') === '2')
      .flush(page([{ ...dto, id: 'p-2' }], { page: 2, hasNextPage: false, totalPages: 2 }));
    expect((await result).map(p => p.id)).toEqual(['p-1', 'p-2']);
  });

  describe('getById', () => {
    it('reads one player', async () => {
      const result = repository.getById('p-1');
      const request = http.expectOne(`${playersUrl}/p-1`);
      expect(request.request.method).toBe('GET');
      request.flush(dto);
      expect((await result)?.id).toBe('p-1');
    });

    it('returns undefined for 404 players.not_found', async () => {
      const result = repository.getById('missing');
      http.expectOne(`${playersUrl}/missing`)
        .flush({ code: 'players.not_found' }, { status: 404, statusText: 'Not Found' });
      expect(await result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('posts the API body with blank optional fields as null', async () => {
      const result = repository.create({
        firstName: 'Ana', lastName: 'Gil', email: ' ', phone: '', documentId: '30111222', birthDate: '',
        genderId: 'g-f', categoryId: '', club: 'Norte', isActive: true
      });
      const request = http.expectOne(playersUrl);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        firstName: 'Ana', lastName: 'Gil', email: null, phone: null, documentId: '30111222', birthDate: null,
        genderId: 'g-f', categoryId: null, club: 'Norte', isActive: true
      });
      request.flush(dto, { status: 201, statusText: 'Created' });
      expect((await result).id).toBe('p-1');
    });

    it('maps 409 players.email_taken to its translation key', async () => {
      const result = repository.create({ firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', isActive: true });
      http.expectOne(playersUrl).flush({ code: 'players.email_taken' }, { status: 409, statusText: 'Conflict' });
      await expectAsync(result).toBeRejectedWithError('players.errors.email_taken');
    });

    it('maps 400 players.unknown_category to its translation key', async () => {
      const result = repository.create({ firstName: 'Ana', lastName: 'Gil', categoryId: 'x', isActive: true });
      http.expectOne(playersUrl).flush({ code: 'players.unknown_category' }, { status: 400, statusText: 'Bad Request' });
      await expectAsync(result).toBeRejectedWithError('players.errors.unknown_category');
    });

    it('maps an unknown problem code to the generic error key, never a raw code', async () => {
      const result = repository.create({ firstName: 'Ana', lastName: 'Gil', isActive: true });
      http.expectOne(playersUrl).flush({ code: 'players.something_new' }, { status: 400, statusText: 'Bad Request' });
      await expectAsync(result).toBeRejectedWithError('common.unexpectedError');
    });

    it('refuses without an active organization and sends nothing', async () => {
      activeOrganizationId.set(null);
      await expectAsync(repository.create({ firstName: 'Ana', lastName: 'Gil', isActive: true }))
        .toBeRejectedWithError('players.errors.organization_id_required');
      http.expectNone(() => true);
    });
  });

  describe('update', () => {
    it('reads the current player and puts every editable field merged with the changes', async () => {
      const result = repository.update('p-1', { club: 'Sur' });
      http.expectOne(`${playersUrl}/p-1`).flush(dto);
      await settle();
      const request = http.expectOne(r => r.method === 'PUT' && r.url === `${playersUrl}/p-1`);
      expect(request.request.body).toEqual({
        firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', phone: null, documentId: '30111222',
        birthDate: '1990-05-20', genderId: 'g-f', categoryId: 'c-4', club: 'Sur', isActive: true
      });
      request.flush({ ...dto, club: 'Sur' });
      expect((await result).club).toBe('Sur');
    });

    it('rejects with players.errors.not_found when the player is gone and sends no PUT', async () => {
      const result = repository.update('p-1', { club: 'Sur' });
      http.expectOne(`${playersUrl}/p-1`).flush({ code: 'players.not_found' }, { status: 404, statusText: 'Not Found' });
      await expectAsync(result).toBeRejectedWithError('players.errors.not_found');
      http.expectNone(r => r.method === 'PUT');
    });

    it('maps 409 players.document_taken to its translation key', async () => {
      const result = repository.update('p-1', { documentId: '1' });
      http.expectOne(`${playersUrl}/p-1`).flush(dto);
      await settle();
      http.expectOne(r => r.method === 'PUT').flush({ code: 'players.document_taken' }, { status: 409, statusText: 'Conflict' });
      await expectAsync(result).toBeRejectedWithError('players.errors.document_taken');
    });
  });

  it('setActive deactivates through the update contract (players are never deleted)', async () => {
    const result = repository.setActive('p-1', false);
    http.expectOne(`${playersUrl}/p-1`).flush(dto);
    await settle();
    const request = http.expectOne(r => r.method === 'PUT' && r.url === `${playersUrl}/p-1`);
    expect(request.request.body.isActive).toBe(false);
    expect(request.request.body.firstName).toBe('Ana');
    request.flush({ ...dto, isActive: false });
    expect((await result).isActive).toBe(false);
    http.expectNone(r => r.method === 'DELETE');
  });
});
