import { TestBed } from '@angular/core/testing';
import { DrawPlannerService } from './draw-planner.service';
import { ApiTournamentAdminRepository } from '../repositories/api/api-tournament-admin.repository';
import { ApiTournamentDrawRepository } from '../repositories/api/api-tournament-draw.repository';
import { ApiRegistrationRepository } from '../repositories/api/api-registration.repository';
import { DrawParticipant } from '../models';

describe('DrawPlannerService', () => {
  let service: DrawPlannerService;
  let registrations: jasmine.SpyObj<ApiRegistrationRepository>;

  const confirmed: DrawParticipant[] = [
    { id: 'r-1', displayName: 'Ana Gil / Bea Paz', members: ['Ana Gil', 'Bea Paz'], seedRank: null, separationKey: 'Norte' }
  ];

  beforeEach(() => {
    registrations = jasmine.createSpyObj<ApiRegistrationRepository>('ApiRegistrationRepository', ['getDrawParticipants']);
    TestBed.configureTestingModule({
      providers: [
        DrawPlannerService,
        { provide: ApiRegistrationRepository, useValue: registrations },
        { provide: ApiTournamentAdminRepository, useValue: { getById: () => Promise.resolve({ id: 't-1' }) } },
        { provide: ApiTournamentDrawRepository, useValue: { get: () => Promise.resolve(null) } }
      ]
    });
    service = TestBed.inject(DrawPlannerService);
  });

  it('reads the confirmed registrations of the loaded tournament as draw participants', async () => {
    registrations.getDrawParticipants.and.resolveTo(confirmed);
    await service.load('t-1');

    expect(await service.loadConfirmedParticipants()).toEqual(confirmed);
    expect(registrations.getDrawParticipants).toHaveBeenCalledOnceWith('t-1');
  });

  it('rejects with the translation key of the failure', async () => {
    registrations.getDrawParticipants.and.rejectWith(new Error('tournaments.errors.forbidden'));
    await service.load('t-1');

    await expectAsync(service.loadConfirmedParticipants()).toBeRejectedWithError('tournaments.errors.forbidden');
  });

  it('refuses without a loaded tournament', async () => {
    await expectAsync(service.loadConfirmedParticipants()).toBeRejectedWithError('common.notFound');
    expect(registrations.getDrawParticipants).not.toHaveBeenCalled();
  });
});
