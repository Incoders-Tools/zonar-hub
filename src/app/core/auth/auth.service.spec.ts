import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { buildImpersonationTarget } from '../../testing/helpers/build-impersonation-session';
import { API_BASE_URL } from '../config/api-base-url.token';

function makeImpersonationStub(active = false) {
  const target = active ? buildImpersonationTarget() : null;
  return {
    active: jasmine.createSpy('active').and.returnValue(active),
    target: jasmine.createSpy('target').and.returnValue(target),
    session: jasmine.createSpy('session').and.returnValue(null),
    expiresAt: jasmine.createSpy('expiresAt').and.returnValue(null),
    token: jasmine.createSpy('token').and.returnValue(active ? 'imp-token' : null),
    start: jasmine.createSpy('start').and.resolveTo(undefined),
    stop: jasmine.createSpy('stop').and.resolveTo(undefined),
    forceStop: jasmine.createSpy('forceStop'),
    checkAvailability: jasmine.createSpy('checkAvailability').and.resolveTo({ enabled: true }),
    setRepository: jasmine.createSpy('setRepository')
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let impStub: ReturnType<typeof makeImpersonationStub>;

  function setup(impersonationActive = false): void {
    impStub = makeImpersonationStub(impersonationActive);
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ImpersonationService, useValue: impStub }
      ]
    });
    service = TestBed.inject(AuthService);
  }

  afterEach(() => localStorage.clear());

  // ---------------------------------------------------------------------------
  // Baseline (non-impersonation) — existing behaviour must be unchanged
  // ---------------------------------------------------------------------------

  it('should be created', () => {
    setup();
    expect(service).toBeTruthy();
  });

  it('currentUser() should return null when not authenticated and not impersonating', () => {
    setup();
    expect(service.currentUser()).toBeNull();
  });

  it('isAuthenticated() should be false when no session', () => {
    setup();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('realUser() should return null when not authenticated', () => {
    setup();
    expect(service.realUser()).toBeNull();
  });

  it('isImpersonating() should be false when ImpersonationService.active() is false', () => {
    setup(false);
    expect(service.isImpersonating()).toBeFalse();
  });

  // ---------------------------------------------------------------------------
  // Impersonation-mode variants — new behaviour
  // ---------------------------------------------------------------------------

  it('currentUser() should return the impersonation target when active() is true', () => {
    setup(true);
    const target = buildImpersonationTarget();
    // currentUser() should reflect the effective (impersonated) user
    const effective = service.currentUser();
    expect(effective).toBeTruthy();
    expect(effective!.id).toBe(target.id);
    expect(effective!.email).toBe(target.email);
    expect(effective!.role as string).toBe(target.role);
  });

  it('isImpersonating() should mirror ImpersonationService.active()', () => {
    setup(true);
    expect(service.isImpersonating()).toBeTrue();
  });

  it('realUser() should return the real sysadmin user when NOT impersonating', () => {
    // setup() calls localStorage.clear() internally, so we seed AFTER setup
    setup(false);
    const fakeSession = {
      user: {
        id: 'sysadmin-001',
        email: 'sysadmin@zonarhub.dev',
        fullName: 'System Admin',
        role: 'system_admin',
        roleId: 'role001',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z'
      },
      token: 'real-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
    // Simulate a login by directly calling the private-enough method via login
    // — instead, poke the session via the login flow using the fake token from localStorage.
    // Easiest: re-create service after seeding (setup calls clear, so we must set after and re-inject)
    localStorage.setItem('zh_auth_session', JSON.stringify(fakeSession));
    // Re-inject causes a new instance which re-reads localStorage
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ImpersonationService, useValue: makeImpersonationStub(false) }
      ]
    });
    service = TestBed.inject(AuthService);
    expect(service.realUser()).toBeTruthy();
    expect(service.realUser()!.id).toBe('sysadmin-001');
  });

  it('realUser() should always return the real sysadmin even when impersonating', () => {
    const fakeSession = {
      user: {
        id: 'sysadmin-001',
        email: 'sysadmin@zonarhub.dev',
        fullName: 'System Admin',
        role: 'system_admin',
        roleId: 'role001',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z'
      },
      token: 'real-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };
    // Seed BEFORE creating service so the constructor restores it
    localStorage.setItem('zh_auth_session', JSON.stringify(fakeSession));
    // setup() calls localStorage.clear() so we must pass the session after the reset
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: ImpersonationService, useValue: makeImpersonationStub(true) } // impersonation active
      ]
    });
    service = TestBed.inject(AuthService);
    // realUser() must always be the sysadmin, not the target
    expect(service.realUser()!.id).toBe('sysadmin-001');
    // currentUser() must be the target
    const target = buildImpersonationTarget();
    expect(service.currentUser()!.id).toBe(target.id);
  });

  it('isSystemAdmin() should be false while impersonating a non-sysadmin target', () => {
    setup(true);
    // target.role = 'player' → effective user is not system_admin
    expect(service.isSystemAdmin()).toBeFalse();
  });
});
