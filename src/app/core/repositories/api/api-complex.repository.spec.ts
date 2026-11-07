import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ActiveOrganizationService } from '../../services/active-organization.service';
import { ApiComplexRepository } from './api-complex.repository';

describe('ApiComplexRepository aggregate contract', () => {
  let repository: ApiComplexRepository;
  let http: HttpTestingController;
  const dto = { id: 'complex-1', organizationId: 'org-1', name: 'Arena', key: null, address: 'Main', location: null, description: null, sortOrder: 0, preponderance: 0, logoImagePath: null, coverImagePath: null, layoutDiagramPath: null, isActive: true, createdAtUtc: '', updatedAtUtc: '', courtCount: 3 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }, { provide: ActiveOrganizationService, useValue: { activeOrganizationId: () => 'org-1' } }] });
    repository = TestBed.inject(ApiComplexRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the API court count on list and after reload', async () => {
    const first = repository.getAll();
    http.expectOne('/api/admin/complexes?organizationId=org-1').flush([dto]);
    expect((await first)[0].courtsCount).toBe(3);
    const reload = repository.getAll();
    http.expectOne('/api/admin/complexes?organizationId=org-1').flush([dto]);
    expect((await reload)[0].courtsCount).toBe(3);
  });

  it('uses zero for legacy rows without a count', async () => {
    const result = repository.getAll();
    http.expectOne('/api/admin/complexes?organizationId=org-1').flush([{ ...dto, courtCount: undefined }]);
    expect((await result)[0].courtsCount).toBe(0);
  });

  it('sends one aggregate POST with court configuration and explicit deletes', async () => {
    const payload = { complexId: 'complex-1', organizationId: 'org-1', name: 'Arena', address: 'Main', courts: [{ id: null, name: 'Indoor', isActive: true, surfaceType: 'synthetic', isIndoor: true, sportIds: ['sport-1'] }], deleteCourtIds: ['court-old'] };
    const result = repository.saveWithCourts(payload);
    const request = http.expectOne('/api/admin/complexes/save');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ complex_id: 'complex-1', court_count: 1, court_ids: ['court-new'] });
    expect(await result).toEqual({ complexId: 'complex-1', courtCount: 1, courtIds: ['court-new'] });
  });

  it('propagates aggregate errors without issuing a second request', async () => {
    const result = repository.saveWithCourts({ complexId: null, organizationId: 'org-1', name: 'Arena', address: 'Main', courts: [], deleteCourtIds: [] });
    http.expectOne('/api/admin/complexes/save').flush({ code: 'complex.saveFailed' }, { status: 409, statusText: 'Conflict' });
    await expectAsync(result).toBeRejected();
    http.expectNone('/api/admin/courts');
  });
});
