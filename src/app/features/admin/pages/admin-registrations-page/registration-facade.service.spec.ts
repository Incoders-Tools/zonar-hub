import { TestBed } from '@angular/core/testing';
import { RegistrationFacadeService } from './registration-facade.service';
import { ApiRegistrationRepository } from '../../../../core/repositories/api/api-registration.repository';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { buildCapacity, buildRegistration } from '../../../../core/models/tournament-registration.testing';

const openCapacity = buildCapacity();

describe('RegistrationFacadeService', () => {
  let facade: RegistrationFacadeService;
  let repo: jasmine.SpyObj<ApiRegistrationRepository>;
  let notifications: jasmine.SpyObj<NotificationService>;

  const pending = buildRegistration();
  const waitlisted = buildRegistration({
    id: 'r-2', status: 'waitlisted', paymentStatus: 'paid',
    participants: [{ slotNumber: 1, playerId: 'p-3', firstName: 'Caro', lastName: 'Ruiz', displayName: 'Caro Ruiz', club: null }]
  });

  beforeEach(() => {
    repo = jasmine.createSpyObj<ApiRegistrationRepository>('ApiRegistrationRepository',
      ['list', 'getById', 'create', 'transition', 'setPayment', 'getDrawParticipants']);
    repo.list.and.resolveTo({ items: [pending, waitlisted], capacity: openCapacity });
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'warning', 'info']);
    TestBed.configureTestingModule({
      providers: [
        RegistrationFacadeService,
        { provide: ApiRegistrationRepository, useValue: repo },
        { provide: NotificationService, useValue: notifications },
        { provide: I18nService, useValue: { translate: (key: string) => `t:${key}` } }
      ]
    });
    facade = TestBed.inject(RegistrationFacadeService);
  });

  it('loads nothing until a tournament is selected', async () => {
    await facade.load();
    expect(repo.list).not.toHaveBeenCalled();
    expect(facade.registrations()).toEqual([]);
    expect(facade.capacity()).toBeNull();
  });

  it('loads the selected tournament registrations and capacity', async () => {
    await facade.selectTournament('t-1');
    expect(repo.list).toHaveBeenCalledOnceWith('t-1', undefined);
    expect(facade.registrations().map(r => r.id)).toEqual(['r-1', 'r-2']);
    expect(facade.capacity()).toEqual(openCapacity);
    expect(facade.loading()).toBeFalse();
    expect(facade.error()).toBeNull();
  });

  it('keeps the translation key of a failed load as the error state', async () => {
    repo.list.and.rejectWith(new Error('tournaments.errors.forbidden'));
    await facade.selectTournament('t-1');
    expect(facade.error()).toBe('tournaments.errors.forbidden');
    expect(facade.registrations()).toEqual([]);
  });

  it('asks the API for a status and filters payment and names locally', async () => {
    await facade.selectTournament('t-1');
    await facade.applyFilters({ status: 'waitlisted', paymentStatus: 'paid', search: 'caro' });
    expect(repo.list.calls.mostRecent().args).toEqual(['t-1', 'waitlisted']);
    expect(facade.filteredRegistrations().map(r => r.id)).toEqual(['r-2']);

    await facade.applyFilters({ search: 'gil' });
    expect(facade.filteredRegistrations().map(r => r.id)).toEqual(['r-1']);
  });

  it('sends the transition with the revision that was read, confirms it and reloads', async () => {
    await facade.selectTournament('t-1');
    repo.transition.and.resolveTo({ ...pending, status: 'confirmed', revision: 3 });

    expect(await facade.transition(pending, 'confirm')).toBeTrue();
    expect(repo.transition).toHaveBeenCalledOnceWith('t-1', 'r-1', 'confirm', 2);
    expect(notifications.success).toHaveBeenCalledWith('t:registrations.feedback.confirm');
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('reloads with a translated warning when someone else changed the registration', async () => {
    await facade.selectTournament('t-1');
    repo.transition.and.rejectWith(new Error('registrations.errors.concurrent_modification'));

    expect(await facade.transition(pending, 'reject')).toBeFalse();
    expect(notifications.warning).toHaveBeenCalledWith('t:registrations.errors.concurrent_modification');
    expect(notifications.error).not.toHaveBeenCalled();
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('reports other refusals as errors and shows the stored state again', async () => {
    await facade.selectTournament('t-1');
    repo.transition.and.rejectWith(new Error('registrations.errors.capacity_reached'));

    expect(await facade.transition(waitlisted, 'confirm')).toBeFalse();
    expect(notifications.error).toHaveBeenCalledWith('t:registrations.errors.capacity_reached');
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('never sends a transition D2 does not allow for the status', async () => {
    await facade.selectTournament('t-1');
    expect(await facade.transition(waitlisted, 'reject')).toBeFalse();
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('never confirms while the places are taken', async () => {
    repo.list.and.resolveTo({ items: [pending], capacity: { ...openCapacity, confirmed: 8, placesLeft: 0 } });
    await facade.selectTournament('t-1');
    expect(facade.capacityFull()).toBeTrue();
    expect(await facade.transition(pending, 'confirm')).toBeFalse();
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('marks a manual payment with the revision and reloads', async () => {
    await facade.selectTournament('t-1');
    repo.setPayment.and.resolveTo({ ...pending, paymentStatus: 'paid', revision: 3 });

    expect(await facade.setPayment(pending, 'paid')).toBeTrue();
    expect(repo.setPayment).toHaveBeenCalledOnceWith('t-1', 'r-1', 'paid', 2);
    expect(notifications.success).toHaveBeenCalledWith('t:registrations.feedback.paid');
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('never sends a payment change the payment status does not allow', async () => {
    await facade.selectTournament('t-1');
    expect(await facade.setPayment(pending, 'refunded')).toBeFalse();
    expect(repo.setPayment).not.toHaveBeenCalled();
  });

  it('creates a registration for the selected tournament and reloads', async () => {
    await facade.selectTournament('t-1');
    repo.create.and.resolveTo(pending);
    const body = { participants: [{ slotNumber: 1, playerId: 'p-1' }], status: 'pending' as const, publicNameConsent: false };

    expect(await facade.create(body)).toBeTrue();
    expect(repo.create).toHaveBeenCalledOnceWith('t-1', body);
    expect(notifications.success).toHaveBeenCalledWith('t:registrations.feedback.created');
    expect(facade.saving()).toBeFalse();
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('reports a refused create with its translation key and keeps the list', async () => {
    await facade.selectTournament('t-1');
    repo.create.and.rejectWith(new Error('registrations.errors.player_already_registered'));

    expect(await facade.create({ participants: [], status: 'pending', publicNameConsent: false })).toBeFalse();
    expect(notifications.error).toHaveBeenCalledWith('t:registrations.errors.player_already_registered');
    expect(repo.list).toHaveBeenCalledTimes(1);
  });

  it('clears the list when the tournament selection is cleared', async () => {
    await facade.selectTournament('t-1');
    await facade.selectTournament(null);
    expect(facade.registrations()).toEqual([]);
    expect(facade.capacity()).toBeNull();
    expect(facade.tournamentId()).toBeNull();
  });
});
