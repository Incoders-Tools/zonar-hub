import { TestBed } from '@angular/core/testing';
import { buildImpersonationSession, buildImpersonationTarget } from '../../testing/helpers/build-impersonation-session';
import { ImpersonationHealthResponse, ImpersonationSession, StartImpersonationResponse } from './impersonation.model';
import { ImpersonationRepository } from './impersonation.repository';
import { ImpersonationService } from './impersonation.service';

const SESSION_KEY = 'zh_impersonation_session';

/** Minimal stub implementing ImpersonationRepository */
function makeRepoStub(overrides: Partial<ImpersonationRepository> = {}): ImpersonationRepository {
  return {
    start: jasmine.createSpy('start').and.resolveTo({
      token: 'stub-token',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      sessionId: 'sess-001',
      target: buildImpersonationTarget()
    } satisfies StartImpersonationResponse),
    stop: jasmine.createSpy('stop').and.resolveTo(undefined),
    health: jasmine.createSpy('health').and.resolveTo({ enabled: true } satisfies ImpersonationHealthResponse),
    ...overrides
  };
}

describe('ImpersonationService', () => {
  let service: ImpersonationService;
  let repo: ImpersonationRepository;

  /** Helper: create a fresh TestBed + inject service. */
  function createService(seedSessionStorage?: ImpersonationSession | null): ImpersonationService {
    sessionStorage.clear();
    if (seedSessionStorage !== undefined && seedSessionStorage !== null) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(seedSessionStorage));
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ImpersonationService] });
    const svc = TestBed.inject(ImpersonationService);
    repo = makeRepoStub();
    svc.setRepository(repo);
    return svc;
  }

  beforeEach(() => {
    sessionStorage.clear();
    service = createService();
  });

  afterEach(() => sessionStorage.clear());

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with active() === false when no sessionStorage entry', () => {
    expect(service.active()).toBeFalse();
    expect(service.session()).toBeNull();
    expect(service.target()).toBeNull();
    expect(service.expiresAt()).toBeNull();
    expect(service.token()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // start()
  // ---------------------------------------------------------------------------

  it('start() should call repository.start with correct params', async () => {
    await service.start('user-999', 'test reason');
    expect(repo.start).toHaveBeenCalledWith({ userId: 'user-999', reason: 'test reason' });
  });

  it('start() should set session signal and active() becomes true', async () => {
    await service.start('user-999');
    expect(service.active()).toBeTrue();
    expect(service.session()).toBeTruthy();
    expect(service.target()).toEqual(buildImpersonationTarget());
  });

  it('start() should write session to sessionStorage', async () => {
    await service.start('user-abc');
    const raw = sessionStorage.getItem(SESSION_KEY);
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw!) as ImpersonationSession;
    expect(stored.token).toBe('stub-token');
  });

  it('token() should return the impersonation token when active', async () => {
    await service.start('user-abc');
    expect(service.token()).toBe('stub-token');
  });

  // ---------------------------------------------------------------------------
  // stop()
  // ---------------------------------------------------------------------------

  it('stop() should call repository.stop', async () => {
    await service.start('user-xyz');
    await service.stop();
    expect(repo.stop).toHaveBeenCalled();
  });

  it('stop() should clear the signal (active becomes false)', async () => {
    await service.start('user-xyz');
    await service.stop();
    expect(service.active()).toBeFalse();
    expect(service.session()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('stop() should remove sessionStorage entry', async () => {
    await service.start('user-xyz');
    await service.stop();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('stop() should clear signal even when repository.stop throws', async () => {
    const failRepo = makeRepoStub({
      stop: jasmine.createSpy('stop').and.rejectWith(new Error('network error'))
    });
    service.setRepository(failRepo);
    await service.start('user-xyz');
    // stop() eats the error internally and still clears session
    await service.stop();
    expect(service.active()).toBeFalse();
  });

  // ---------------------------------------------------------------------------
  // forceStop()
  // ---------------------------------------------------------------------------

  it('forceStop() should clear signal without calling repository.stop', async () => {
    await service.start('user-xyz');
    service.forceStop();
    expect(repo.stop).not.toHaveBeenCalled();
    expect(service.active()).toBeFalse();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('token() should return null after forceStop()', async () => {
    await service.start('user-xyz');
    service.forceStop();
    expect(service.token()).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Rehydration on boot
  // ---------------------------------------------------------------------------

  it('should rehydrate a non-expired sessionStorage entry on boot', () => {
    const validSession = buildImpersonationSession();
    const svc = createService(validSession);
    expect(svc.active()).toBeTrue();
    expect(svc.token()).toBe(validSession.token);
  });

  it('should discard an expired sessionStorage entry on boot (active stays false)', () => {
    const expired = buildImpersonationSession({ expired: true });
    const svc = createService(expired);
    expect(svc.active()).toBeFalse();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('should leave active() false when sessionStorage is empty', () => {
    const svc = createService(null);
    expect(svc.active()).toBeFalse();
  });

  // ---------------------------------------------------------------------------
  // checkAvailability()
  // ---------------------------------------------------------------------------

  it('checkAvailability() should call repository.health and return its result', async () => {
    const result = await service.checkAvailability();
    expect(repo.health).toHaveBeenCalled();
    expect(result.enabled).toBeTrue();
  });

  it('checkAvailability() should return { enabled: false } when no repository is set', async () => {
    // Create a fresh service with no repo injected
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ImpersonationService] });
    const freshSvc = TestBed.inject(ImpersonationService);
    // Do NOT call setRepository — should return safe default
    const result = await freshSvc.checkAvailability();
    expect(result.enabled).toBeFalse();
  });
});
