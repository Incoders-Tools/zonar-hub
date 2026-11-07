import { TestBed } from '@angular/core/testing';
import { buildPublicTournament } from '../models/public-tournament.testing';
import { buildKnockoutDraw } from '../models/tournament-draw.testing';
import { ApiPublicTournamentRepository } from '../repositories/api/api-public-tournament.repository';
import { ApiTournamentAdminRepository } from '../repositories/api/api-tournament-admin.repository';
import { PublicTournamentService } from './public-tournament.service';
import { TournamentService } from './tournament.service';

describe('PublicTournamentService', () => {
  let repository: jasmine.SpyObj<ApiPublicTournamentRepository>;
  let service: PublicTournamentService;

  beforeEach(() => {
    repository = jasmine.createSpyObj<ApiPublicTournamentRepository>('ApiPublicTournamentRepository', ['getAll', 'getBySlug', 'getDraw']);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiPublicTournamentRepository, useValue: repository }]
    });
    service = TestBed.inject(PublicTournamentService);
  });

  it('loads the public tournaments and exposes them with loading turned off afterwards', async () => {
    const items = [buildPublicTournament()];
    repository.getAll.and.resolveTo(items);

    const pending = service.load();
    expect(service.loading()).toBeTrue();
    await pending;

    expect(service.tournaments()).toEqual(items);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('reports the error key and clears the list when loading fails', async () => {
    repository.getAll.and.rejectWith(new Error('common.networkUnavailable'));

    await service.load();

    expect(service.tournaments()).toEqual([]);
    expect(service.error()).toBe('common.networkUnavailable');
    expect(service.loading()).toBeFalse();
  });

  it('keeps only tournaments that have not ended yet as upcoming', async () => {
    const past = buildPublicTournament({ slug: 'past', startDate: '2000-01-01', endDate: '2000-01-02' });
    const future = buildPublicTournament({ slug: 'future' });
    repository.getAll.and.resolveTo([past, future]);

    await service.load();

    expect(service.upcomingTournaments().map(t => t.slug)).toEqual(['future']);
  });

  it('returns the tournament for a slug and null when the API reports it as not found', async () => {
    const tournament = buildPublicTournament();
    repository.getBySlug.withArgs('open-norte-abc123').and.resolveTo(tournament);
    repository.getBySlug.withArgs('missing').and.resolveTo(undefined);

    expect(await service.getBySlug('open-norte-abc123')).toEqual(tournament);
    expect(await service.getBySlug('missing')).toBeNull();
  });

  it('returns the published draw of a slug, or null when there is none', async () => {
    const draw = buildKnockoutDraw(4);
    repository.getDraw.withArgs('open-norte-abc123').and.resolveTo(draw);
    repository.getDraw.withArgs('missing').and.resolveTo(null);

    expect(await service.getDraw('open-norte-abc123')).toEqual(draw);
    expect(await service.getDraw('missing')).toBeNull();
  });

  it('propagates detail failures so the page can offer a retry', async () => {
    repository.getBySlug.and.rejectWith(new Error('common.unexpectedError'));

    await expectAsync(service.getBySlug('open-norte-abc123')).toBeRejectedWithError('common.unexpectedError');
  });
});

describe('TournamentService (backoffice) keeps reading the admin repository', () => {
  it('loads tournaments through ApiTournamentAdminRepository and never through the public one', async () => {
    const admin = jasmine.createSpyObj<ApiTournamentAdminRepository>('ApiTournamentAdminRepository', ['getAll']);
    const publicRepository = jasmine.createSpyObj<ApiPublicTournamentRepository>('ApiPublicTournamentRepository', ['getAll', 'getBySlug']);
    admin.getAll.and.resolveTo([]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiTournamentAdminRepository, useValue: admin },
        { provide: ApiPublicTournamentRepository, useValue: publicRepository }
      ]
    });

    await TestBed.inject(TournamentService).loadTournaments();

    expect(admin.getAll).toHaveBeenCalledTimes(1);
    expect(publicRepository.getAll).not.toHaveBeenCalled();
  });
});
