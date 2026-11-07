import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { publicRequestContext } from '../http/public-request.context';
import { TenantContextService } from '../services/tenant-context.service';
import { AuthService } from './auth.service';
import { tenantHeaderInterceptor } from './tenant-header.interceptor';

describe('tenantHeaderInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantHeaderInterceptor])),
        provideHttpClientTesting(),
        { provide: TenantContextService, useValue: { tenantId: () => 'tenant-1' } },
        {
          provide: AuthService,
          useValue: { session: () => ({ organizationId: 'org-1' }), currentUser: () => null }
        }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the tenant and organization headers to a normal request', () => {
    http.get('/api/admin/tournaments').subscribe();

    const req = controller.expectOne('/api/admin/tournaments');
    expect(req.request.headers.get('X-Tenant-Id')).toBe('tenant-1');
    expect(req.request.headers.get('X-Organization-Id')).toBe('org-1');
    req.flush({});
  });

  it('sends no tenant or organization header on a public request', () => {
    http.get('/api/public/tournaments', { context: publicRequestContext() }).subscribe();

    const req = controller.expectOne('/api/public/tournaments');
    expect(req.request.headers.has('X-Tenant-Id')).toBeFalse();
    expect(req.request.headers.has('X-Organization-Id')).toBeFalse();
    req.flush({});
  });
});
