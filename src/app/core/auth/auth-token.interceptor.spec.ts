import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { buildImpersonationTarget } from '../../testing/helpers/build-impersonation-session';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthService } from './auth.service';
import { authTokenInterceptor } from './auth-token.interceptor';

const REAL_TOKEN = 'real-bearer-token';
const IMP_TOKEN = 'imp-bearer-token';

function makeAuthStub(token: string | null): Partial<AuthService> {
  return {
    session: jasmine.createSpy('session').and.returnValue(
      token ? { token, user: { tenantId: 'tenant-real', id: 'sa-001' } } : null
    ) as unknown as AuthService['session']
  };
}

function makeImpStub(active: boolean, impToken = IMP_TOKEN) {
  const target = active ? buildImpersonationTarget() : null;
  return {
    token: jasmine.createSpy('token').and.returnValue(active ? impToken : null),
    active: jasmine.createSpy('active').and.returnValue(active),
    target: jasmine.createSpy('target').and.returnValue(target),
    forceStop: jasmine.createSpy('forceStop'),
    session: jasmine.createSpy('session').and.returnValue(null),
    expiresAt: jasmine.createSpy('expiresAt').and.returnValue(null),
    start: jasmine.createSpy('start').and.resolveTo(),
    stop: jasmine.createSpy('stop').and.resolveTo(),
    checkAvailability: jasmine.createSpy('checkAvailability').and.resolveTo({ enabled: true }),
    setRepository: jasmine.createSpy('setRepository')
  };
}

describe('authTokenInterceptor (impersonation variants)', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authStub: Partial<AuthService>;
  let impStub: ReturnType<typeof makeImpStub>;

  function setup(impersonationActive: boolean): void {
    authStub = makeAuthStub(REAL_TOKEN);
    impStub = makeImpStub(impersonationActive);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthService, useValue: authStub },
        { provide: ImpersonationService, useValue: impStub }
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  afterEach(() => controller.verify());

  // ---------------------------------------------------------------------------
  // Baseline — non-impersonation path unchanged
  // ---------------------------------------------------------------------------

  it('attaches the real session token when impersonation is inactive', () => {
    setup(false);
    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${REAL_TOKEN}`);
    req.flush({});
  });

  it('attaches the tenant id from session when impersonation is inactive', () => {
    setup(false);
    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');
    expect(req.request.headers.get('X-Tenant-Id')).toBe('tenant-real');
    req.flush({});
  });

  // ---------------------------------------------------------------------------
  // Impersonation active — token swap
  // ---------------------------------------------------------------------------

  it('attaches the impersonation token when active() is true', () => {
    setup(true);
    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${IMP_TOKEN}`);
    req.flush({});
  });

  it('attaches the target tenant id when impersonation is active', () => {
    setup(true);
    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');
    // target.tenantId is 'tenant-abc' from buildImpersonationTarget()
    expect(req.request.headers.get('X-Tenant-Id')).toBe('tenant-abc');
    req.flush({});
  });

  it('does not expose the real-user tenant when impersonating', () => {
    setup(true);
    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');
    expect(req.request.headers.get('X-Tenant-Id')).not.toBe('tenant-real');
    req.flush({});
  });

  // ---------------------------------------------------------------------------
  // forceStop on 401 under impersonation
  // ---------------------------------------------------------------------------

  it('calls ImpersonationService.forceStop() on 401 when impersonation is active', () => {
    setup(true);
    http.get('/api/resource').subscribe({ error: () => {} });
    const req = controller.expectOne('/api/resource');
    req.flush({ code: 'common.unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(impStub.forceStop).toHaveBeenCalledTimes(1);
  });

  it('does NOT call forceStop() on 401 when no impersonation is active', () => {
    setup(false);
    http.get('/api/resource').subscribe({ error: () => {} });
    const req = controller.expectOne('/api/resource');
    req.flush({ code: 'common.unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(impStub.forceStop).not.toHaveBeenCalled();
  });

  it('does NOT call forceStop() on non-401 errors under impersonation', () => {
    setup(true);
    http.get('/api/resource').subscribe({ error: () => {} });
    const req = controller.expectOne('/api/resource');
    req.flush({ code: 'common.forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(impStub.forceStop).not.toHaveBeenCalled();
  });
});
