import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ApiOrganizationRepository } from './api-organization.repository';

const dto = {
  id: 'org-1', tenantId: 'tenant-a', displayName: 'Alpha Circuit', legalName: null, description: 'Circuito amateur',
  type: 'circuito', logoUrl: null, isActive: true, createdAt: '2026-01-01T00:00:00Z', createdByUserId: 'user-1',
  updatedAt: '2026-01-01T00:00:00Z',
  publicProfileEnabled: true,
  websiteUrl: 'https://alpha.example.com',
  instagramUrl: 'https://instagram.com/alpha',
  facebookUrl: null,
  tiktokUrl: null,
  youtubeUrl: 'https://youtube.com/@alpha',
  whatsappPhone: '+5491122334455',
  contactEmail: 'hola@alpha.example.com'
};

const PROFILE_KEYS = [
  'publicProfileEnabled', 'websiteUrl', 'instagramUrl', 'facebookUrl',
  'tiktokUrl', 'youtubeUrl', 'whatsappPhone', 'contactEmail'
];

const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('ApiOrganizationRepository public profile contract', () => {
  let repository: ApiOrganizationRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }]
    });
    repository = TestBed.inject(ApiOrganizationRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function updateWith(changes: Parameters<ApiOrganizationRepository['update']>[1], current = dto) {
    const result = repository.update('org-1', changes);
    http.expectOne(req => req.method === 'GET' && req.url === '/api/admin/organizations/org-1').flush(current);
    await settle();
    const request = http.expectOne(req => req.method === 'PUT' && req.url === '/api/admin/organizations/org-1');
    return { result, request };
  }

  it('maps the consent and the seven link fields from the API response', async () => {
    const result = repository.getById('org-1');
    http.expectOne('/api/admin/organizations/org-1').flush(dto);

    const org = await result;
    expect(org.publicProfileEnabled).toBeTrue();
    expect(org.websiteUrl).toBe('https://alpha.example.com');
    expect(org.instagramUrl).toBe('https://instagram.com/alpha');
    expect(org.facebookUrl).toBeUndefined();
    expect(org.tiktokUrl).toBeUndefined();
    expect(org.youtubeUrl).toBe('https://youtube.com/@alpha');
    expect(org.whatsappPhone).toBe('+5491122334455');
    expect(org.contactEmail).toBe('hola@alpha.example.com');
  });

  it('treats a response without the profile fields as no consent and no links', async () => {
    const legacy = Object.fromEntries(Object.entries(dto).filter(([key]) => !PROFILE_KEYS.includes(key)));
    const result = repository.getAll();
    http.expectOne('/api/admin/organizations').flush({ items: [legacy] });

    const [org] = await result;
    expect(org.publicProfileEnabled).toBeFalse();
    expect(org.websiteUrl).toBeUndefined();
  });

  it('sends all eight profile fields on update, trimming values and turning blanks into null', async () => {
    const { result, request } = await updateWith({
      publicProfileEnabled: false,
      websiteUrl: '  https://new.example.com  ',
      instagramUrl: '',
      facebookUrl: '   ',
      tiktokUrl: 'https://tiktok.com/@alpha',
      youtubeUrl: '',
      whatsappPhone: '',
      contactEmail: ' contacto@alpha.example.com '
    });

    const body = request.request.body;
    expect(PROFILE_KEYS.every(key => key in body)).toBeTrue();
    expect(body.publicProfileEnabled).toBeFalse();
    expect(body.websiteUrl).toBe('https://new.example.com');
    expect(body.instagramUrl).toBeNull();
    expect(body.facebookUrl).toBeNull();
    expect(body.tiktokUrl).toBe('https://tiktok.com/@alpha');
    expect(body.youtubeUrl).toBeNull();
    expect(body.whatsappPhone).toBeNull();
    expect(body.contactEmail).toBe('contacto@alpha.example.com');
    request.flush(dto);
    await result;
  });

  it('keeps the stored profile when an update does not touch it, so deactivating does not clear the links', async () => {
    const { result, request } = await updateWith({ isActive: false });

    expect(request.request.body).toEqual(jasmine.objectContaining({
      isActive: false,
      publicProfileEnabled: true,
      websiteUrl: 'https://alpha.example.com',
      instagramUrl: 'https://instagram.com/alpha',
      facebookUrl: null,
      tiktokUrl: null,
      youtubeUrl: 'https://youtube.com/@alpha',
      whatsappPhone: '+5491122334455',
      contactEmail: 'hola@alpha.example.com'
    }));
    request.flush(dto);
    await result;
  });

  it('sends the consent and links on create', async () => {
    const result = repository.create({
      tenantId: 'tenant-a', displayName: 'Beta', type: 'academia', isActive: true, createdByUserId: 'user-1',
      publicProfileEnabled: true, websiteUrl: 'https://beta.example.com', instagramUrl: '', facebookUrl: undefined,
      tiktokUrl: '', youtubeUrl: '', whatsappPhone: '+5491100000000', contactEmail: ''
    });

    const request = http.expectOne(req => req.method === 'POST' && req.url === '/api/admin/organizations');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      publicProfileEnabled: true,
      websiteUrl: 'https://beta.example.com',
      instagramUrl: null,
      facebookUrl: null,
      tiktokUrl: null,
      youtubeUrl: null,
      whatsappPhone: '+5491100000000',
      contactEmail: null
    }));
    request.flush(dto);
    await result;
  });

  it('surfaces the first organizations.errors key of a validation problem', async () => {
    const { result, request } = await updateWith({ websiteUrl: 'javascript:alert(1)' });

    request.flush(
      { title: 'Validation failed', status: 400, errors: { WebsiteUrl: ['organizations.errors.website_url_invalid'] } },
      { status: 400, statusText: 'Bad Request' }
    );

    await expectAsync(result).toBeRejectedWithError('organizations.errors.website_url_invalid');
  });

  it('surfaces the organizations.errors key carried in a problem detail', async () => {
    const result = repository.getById('org-x');
    http.expectOne('/api/admin/organizations/org-x').flush(
      { title: 'Resource not found', status: 404, detail: 'organizations.errors.not_found', code: 'organizations.not_found' },
      { status: 404, statusText: 'Not Found' }
    );

    await expectAsync(result).toBeRejectedWithError('organizations.errors.not_found');
  });
});
