import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { ApiImpersonationRepository } from './api-impersonation.repository';

describe('ApiImpersonationRepository', () => {
  let repository: ApiImpersonationRepository;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ApiImpersonationRepository,
        { provide: HttpClient, useValue: httpClient },
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    repository = TestBed.inject(ApiImpersonationRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  describe('start()', () => {
    it('should POST to /api/admin/impersonation/start with the correct body', async () => {
      const response = {
        token: 'eyJ.imp.token',
        tokenType: 'Bearer',
        expiresAt: '2026-05-15T18:00:00Z',
        sessionId: 'sess-001',
        target: {
          id: 'user-002',
          fullName: 'Player One',
          email: 'player@example.com',
          role: 'player',
          tenantId: 'tenant-xyz'
        }
      };
      httpClient.post.and.returnValue(of(response));

      const result = await repository.start({ userId: 'user-002', reason: 'Debug issue #42' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/api/admin/impersonation/start',
        { userId: 'user-002', reason: 'Debug issue #42' }
      );
      expect(result.token).toBe('eyJ.imp.token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresAt).toBe('2026-05-15T18:00:00Z');
      expect(result.sessionId).toBe('sess-001');
      expect(result.target.id).toBe('user-002');
      expect(result.target.role).toBe('player');
    });

    it('should POST without reason property when reason is undefined', async () => {
      const response = {
        token: 'eyJ.tok',
        tokenType: 'Bearer',
        expiresAt: '2026-05-15T18:00:00Z',
        sessionId: 'sess-002',
        target: { id: 'user-003', fullName: 'User B', email: 'b@example.com', role: 'player', tenantId: 'tenant-abc' }
      };
      httpClient.post.and.returnValue(of(response));

      await repository.start({ userId: 'user-003' });

      // When reason is omitted the body has userId only (undefined is not serialized)
      const [url, body] = httpClient.post.calls.mostRecent().args;
      expect(url).toBe('/api/admin/impersonation/start');
      expect((body as { userId: string }).userId).toBe('user-003');
    });

    it('should surface error codes via extractApiErrorCode on failure', async () => {
      httpClient.post.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400,
        error: { code: 'impersonation.targetInvalid' }
      })));

      await expectAsync(repository.start({ userId: 'user-bad' }))
        .toBeRejectedWithError('impersonation.targetInvalid');
    });

    it('should surface featureDisabled error code', async () => {
      httpClient.post.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 404,
        error: { code: 'impersonation.featureDisabled' }
      })));

      await expectAsync(repository.start({ userId: 'user-x' }))
        .toBeRejectedWithError('impersonation.featureDisabled');
    });
  });

  describe('stop()', () => {
    it('should POST to /api/admin/impersonation/stop with no body', async () => {
      httpClient.post.and.returnValue(of(null));

      await repository.stop();

      expect(httpClient.post).toHaveBeenCalledWith(
        '/api/admin/impersonation/stop',
        {}
      );
    });

    it('should surface error codes on stop failure', async () => {
      httpClient.post.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400,
        error: { code: 'impersonation.notImpersonating' }
      })));

      await expectAsync(repository.stop())
        .toBeRejectedWithError('impersonation.notImpersonating');
    });
  });

  describe('health()', () => {
    it('should GET /api/admin/impersonation/health and return enabled status', async () => {
      httpClient.get.and.returnValue(of({ enabled: true }));

      const result = await repository.health();

      expect(httpClient.get).toHaveBeenCalledWith('/api/admin/impersonation/health');
      expect(result.enabled).toBeTrue();
    });

    it('should return enabled: false when feature is off', async () => {
      httpClient.get.and.returnValue(of({ enabled: false }));

      const result = await repository.health();

      expect(result.enabled).toBeFalse();
    });

    it('should surface error codes on health failure', async () => {
      httpClient.get.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 503,
        error: null
      })));

      await expectAsync(repository.health())
        .toBeRejectedWithError('common.networkUnavailable');
    });
  });
});
