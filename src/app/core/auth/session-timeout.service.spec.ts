import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SessionTimeoutService } from './session-timeout.service';
import { ImpersonationService } from '../impersonation/impersonation.service';
import { buildImpersonationSession } from '../../testing/helpers/build-impersonation-session';

/**
 * Stub AuthService for session-timeout tests.
 */
function makeAuthStub(authenticated = true) {
  return {
    session: jasmine.createSpy('session').and.returnValue(
      authenticated ? { token: 'real-tok', user: { id: 'sa-001' } } : null
    ),
    logout: jasmine.createSpy('logout')
  };
}

/**
 * Creates a stub ImpersonationService.
 * expiresAt is a function so the test can advance a clock-like value.
 */
function makeImpStub(active = false, expiresAt: string | null = null) {
  return {
    active: jasmine.createSpy('active').and.returnValue(active),
    expiresAt: jasmine.createSpy('expiresAt').and.returnValue(expiresAt),
    forceStop: jasmine.createSpy('forceStop'),
    token: jasmine.createSpy('token').and.returnValue(null),
    target: jasmine.createSpy('target').and.returnValue(null),
    session: jasmine.createSpy('session').and.returnValue(null),
    start: jasmine.createSpy('start').and.resolveTo(),
    stop: jasmine.createSpy('stop').and.resolveTo(),
    checkAvailability: jasmine.createSpy('checkAvailability').and.resolveTo({ enabled: true }),
    setRepository: jasmine.createSpy('setRepository')
  };
}

describe('SessionTimeoutService (impersonation expiry variants)', () => {
  let service: SessionTimeoutService;
  let authStub: ReturnType<typeof makeAuthStub>;
  let impStub: ReturnType<typeof makeImpStub>;
  let router: Router;

  function setup(
    authenticated: boolean,
    impActive: boolean,
    impExpiresAt: string | null
  ): void {
    authStub = makeAuthStub(authenticated);
    impStub = makeImpStub(impActive, impExpiresAt);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SessionTimeoutService,
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: ImpersonationService, useValue: impStub }
      ]
    });
    service = TestBed.inject(SessionTimeoutService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  afterEach(() => {
    service.stopMonitoring();
  });

  // ---------------------------------------------------------------------------
  // Non-impersonation baseline — existing behaviour must be unchanged
  // ---------------------------------------------------------------------------

  it('should be created', () => {
    setup(true, false, null);
    expect(service).toBeTruthy();
  });

  it('showWarning should start as false', () => {
    setup(true, false, null);
    expect(service.showWarning()).toBeFalse();
  });

  // ---------------------------------------------------------------------------
  // 3.6 Impersonation expiry timer
  // ---------------------------------------------------------------------------

  it('should call ImpersonationService.forceStop() when impersonation token expires', fakeAsync(() => {
    // Expire in 2 seconds from now
    const expiresAt = new Date(Date.now() + 2000).toISOString();
    setup(true, true, expiresAt);
    service.startMonitoring();

    // Advance clock past the expiry
    tick(3000);

    expect(impStub.forceStop).toHaveBeenCalledTimes(1);
    service.stopMonitoring();
    tick();
  }));

  it('should NOT call forceStop() before the impersonation token expires', fakeAsync(() => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    setup(true, true, expiresAt);
    service.startMonitoring();

    tick(1000);

    expect(impStub.forceStop).not.toHaveBeenCalled();
    service.stopMonitoring();
    tick();
  }));

  it('should NOT call forceStop() when impersonation is not active', fakeAsync(() => {
    setup(true, false, null);
    service.startMonitoring();

    tick(3000);

    expect(impStub.forceStop).not.toHaveBeenCalled();
    service.stopMonitoring();
    tick();
  }));

  it('should navigate to /admin after forceStop on impersonation expiry', fakeAsync(() => {
    const expiresAt = new Date(Date.now() + 500).toISOString();
    setup(true, true, expiresAt);
    service.startMonitoring();

    tick(2000);

    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    service.stopMonitoring();
    tick();
  }));

  it('should NOT log out the real session when only impersonation expires', fakeAsync(() => {
    const expiresAt = new Date(Date.now() + 500).toISOString();
    setup(true, true, expiresAt);
    service.startMonitoring();

    tick(2000);

    expect(authStub.logout).not.toHaveBeenCalled();
    service.stopMonitoring();
    tick();
  }));
});
