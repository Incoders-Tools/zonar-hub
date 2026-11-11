import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminRegistrationsPageComponent } from './admin-registrations-page.component';
import { ApiRegistrationRepository } from '../../../../core/repositories/api/api-registration.repository';
import { ApiTournamentAdminRepository } from '../../../../core/repositories/api/api-tournament-admin.repository';
import { ApiEligibilityProfileRepository } from '../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { RegistrationService } from '../../../../core/services/registration.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { Tournament, TournamentRegistrationList } from '../../../../core/models';
import { buildCapacity, buildRegistration } from '../../../../core/models/tournament-registration.testing';

const tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', complexId: 'c-1', complexName: 'Arena', categoryId: 'c-4',
  categoryName: 'Cuarta', genderId: 'g-f', genderLabel: 'Femenino', tournamentTypeId: 'tt-1', tournamentTypeName: '',
  sportId: 's-1', sportName: '', statusId: 'upcoming', statusLabel: '', startDate: '2030-12-01', endDate: '2030-12-03',
  registrationStartDate: '', registrationEndDate: '', maxPairs: 8, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', isActive: true, isPublic: true, modalityKey: 'doubles'
} as Tournament;

const pending = buildRegistration();
const waitlistedPaid = buildRegistration({
  id: 'r-2', status: 'waitlisted', paymentStatus: 'paid',
  participants: [{ slotNumber: 1, playerId: 'p-3', firstName: 'Caro', lastName: 'Ruiz', displayName: 'Caro Ruiz', club: 'Sur' }]
});
const confirmedFree = buildRegistration({
  id: 'r-3', status: 'confirmed', paymentStatus: 'notRequired',
  participants: [{ slotNumber: 1, playerId: 'p-4', firstName: 'Dani', lastName: 'Sosa', displayName: 'Dani Sosa', club: null }]
});
const rejected = buildRegistration({
  id: 'r-4', status: 'rejected', paymentStatus: 'notRequired',
  participants: [{ slotNumber: 1, playerId: 'p-5', firstName: 'Eva', lastName: 'Luna', displayName: 'Eva Luna', club: null }]
});

const settle = async (fixture: ComponentFixture<unknown>) => {
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }
};

describe('AdminRegistrationsPageComponent', () => {
  let fixture: ComponentFixture<AdminRegistrationsPageComponent>;
  let component: AdminRegistrationsPageComponent;
  let element: HTMLElement;
  let repo: jasmine.SpyObj<ApiRegistrationRepository>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let i18n: I18nService;
  const organizationChanged = signal(0);

  beforeEach(async () => {
    localStorage.removeItem('zh.collection-view.mode.admin-registrations');
    repo = jasmine.createSpyObj<ApiRegistrationRepository>('ApiRegistrationRepository',
      ['list', 'getById', 'create', 'transition', 'setPayment', 'getDrawParticipants']);
    repo.list.and.resolveTo({ items: [pending, waitlistedPaid, confirmedFree, rejected], capacity: buildCapacity() });
    repo.transition.and.callFake(async (_t, id, transition) =>
      ({ ...pending, id, status: transition === 'confirm' ? 'confirmed' : pending.status }));
    repo.setPayment.and.callFake(async (_t, id, paymentStatus) => ({ ...pending, id, paymentStatus }));
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [AdminRegistrationsPageComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiRegistrationRepository, useValue: repo },
        { provide: NotificationService, useValue: notifications },
        { provide: RegistrationService, useValue: { tokens: signal([]) } },
        {
          provide: TournamentService,
          useValue: {
            tournaments: signal<Tournament[]>([tournament, { ...tournament, id: 't-9', organizationId: 'org-2', name: 'Otra org' }]),
            loadTournaments: jasmine.createSpy('loadTournaments').and.resolveTo(),
            getTournamentById: (id: string) => (id === tournament.id ? tournament : undefined)
          }
        },
        { provide: ActiveOrganizationService, useValue: { organizationChanged, activeOrganizationId: signal('org-1') } },
        { provide: ApiTournamentAdminRepository, useValue: { getEligibilityProfileId: () => Promise.resolve(null) } },
        { provide: ApiEligibilityProfileRepository, useValue: { getById: () => Promise.resolve(undefined) } },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve([]) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve([]) } }
      ]
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    fixture = TestBed.createComponent(AdminRegistrationsPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await settle(fixture);
  });

  afterEach(() => localStorage.removeItem('zh.collection-view.mode.admin-registrations'));

  async function selectTournament(id = 't-1'): Promise<void> {
    component.tournamentControl.setValue(id);
    await settle(fixture);
  }

  function rowOf(name: string): HTMLTableRowElement {
    const row = Array.from(element.querySelectorAll<HTMLTableRowElement>('app-data-table tbody tr'))
      .find(tr => tr.textContent?.includes(name));
    if (!row) throw new Error(`row ${name} not rendered`);
    return row;
  }

  function actionLabels(name: string): string[] {
    return Array.from(rowOf(name).querySelectorAll('.data-table__action-btn')).map(b => b.getAttribute('aria-label') ?? '');
  }

  function labels(...keys: string[]): string[] {
    return keys.map(key => i18n.translate(key));
  }

  async function clickAction(name: string, key: string): Promise<void> {
    const label = i18n.translate(key);
    const button = Array.from(rowOf(name).querySelectorAll<HTMLButtonElement>('.data-table__action-btn'))
      .find(b => b.getAttribute('aria-label') === label);
    if (!button) throw new Error(`${key} not offered for ${name}`);
    button.click();
    await settle(fixture);
  }

  function stat(name: string): string {
    return element.querySelector(`[data-stat="${name}"] dd`)?.textContent?.trim() ?? '';
  }

  function createButton(): HTMLButtonElement {
    return element.querySelector('[data-action="create"] button') as HTMLButtonElement;
  }

  it('offers only the tournaments of the active organization and loads nothing until one is picked', () => {
    expect(component.tournamentOptions().map(o => o.value)).toEqual(['t-1']);
    expect(element.querySelector('[data-state="no-tournament"]')).not.toBeNull();
    expect(createButton().disabled).toBeTrue();
    expect(repo.list).not.toHaveBeenCalled();
  });

  it('loads the picked tournament and shows its places', async () => {
    await selectTournament();

    expect(repo.list).toHaveBeenCalledOnceWith('t-1', undefined);
    expect(element.querySelector('[data-state="no-tournament"]')).toBeNull();
    expect(stat('confirmed')).toBe('3 / 8');
    expect(stat('pending')).toBe('1');
    expect(stat('waitlisted')).toBe('1');
    expect(stat('placesLeft')).toBe('5');
    expect(element.querySelector('[data-hint="capacity-full"]')).toBeNull();
    expect(rowOf('Ana Gil / Bea Paz')).toBeTruthy();
    expect(createButton().disabled).toBeFalse();
  });

  it('shows "no limit" for a tournament without maxPairs', async () => {
    repo.list.and.resolveTo({ items: [], capacity: buildCapacity({ maxPairs: null, placesLeft: null }) });
    await selectTournament();

    expect(stat('confirmed')).toBe('3');
    expect(stat('placesLeft')).toBe(i18n.translate('registrations.capacity.unlimited'));
  });

  it('shows the loading state while the list is read', async () => {
    let resolve!: (list: TournamentRegistrationList) => void;
    repo.list.and.returnValue(new Promise(r => (resolve = r)));
    await selectTournament();
    expect(element.querySelector('app-data-table app-loading-state')).not.toBeNull();

    resolve({ items: [pending], capacity: buildCapacity() });
    await settle(fixture);
    expect(element.querySelector('app-data-table app-loading-state')).toBeNull();
    expect(rowOf('Ana Gil')).toBeTruthy();
  });

  it('shows the empty state when the tournament has no registrations', async () => {
    repo.list.and.resolveTo({ items: [], capacity: buildCapacity({ confirmed: 0, pending: 0, waitlisted: 0, placesLeft: 8 }) });
    await selectTournament();

    expect(element.querySelector('app-data-table app-empty-state')).not.toBeNull();
  });

  it('shows the translated load error and retries', async () => {
    repo.list.and.rejectWith(new Error('registrations.errors.tournament_not_found'));
    await selectTournament();

    const alert = element.querySelector('.admin-registrations__load-error');
    expect(alert?.textContent?.trim()).toBe(i18n.translate('registrations.errors.tournament_not_found'));
    expect(element.querySelector('app-data-table app-error-state')).not.toBeNull();

    repo.list.and.resolveTo({ items: [pending], capacity: buildCapacity() });
    (element.querySelector('app-data-table app-error-state button') as HTMLButtonElement).click();
    await settle(fixture);
    expect(element.querySelector('.admin-registrations__load-error')).toBeNull();
    expect(rowOf('Ana Gil')).toBeTruthy();
  });

  it('offers only the D2 transitions and payment marks of each row', async () => {
    await selectTournament();

    expect(actionLabels('Ana Gil')).toEqual(labels(
      'registrations.action.confirm', 'registrations.action.reject', 'registrations.action.waitlist',
      'registrations.action.cancel', 'registrations.action.markPaid', 'share.label'));
    expect(actionLabels('Caro Ruiz')).toEqual(labels(
      'registrations.action.confirm', 'registrations.action.cancel', 'registrations.action.markRefunded', 'share.label'));
    expect(actionLabels('Dani Sosa')).toEqual(labels('registrations.action.cancel', 'share.label'));
    expect(actionLabels('Eva Luna')).toEqual(labels('share.label'));
  });

  it('confirms at once with the revision that was read', async () => {
    await selectTournament();
    await clickAction('Ana Gil', 'registrations.action.confirm');

    expect(element.querySelector('app-confirm-dialog')).toBeNull();
    expect(repo.transition).toHaveBeenCalledOnceWith('t-1', 'r-1', 'confirm', 2);
    expect(notifications.success).toHaveBeenCalled();
    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it('replaces confirm with its explanation while the places are taken', async () => {
    repo.list.and.resolveTo({ items: [pending], capacity: buildCapacity({ confirmed: 8, placesLeft: 0 }) });
    await selectTournament();

    expect(element.querySelector('[data-hint="capacity-full"]')?.textContent)
      .toContain(i18n.translate('registrations.capacity.fullExplanation'));
    expect(actionLabels('Ana Gil')).not.toContain(i18n.translate('registrations.action.confirm'));
    await clickAction('Ana Gil', 'registrations.action.confirmFull');

    expect(notifications.warning).toHaveBeenCalledOnceWith(i18n.translate('registrations.capacity.fullExplanation'));
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('rejects only after the confirm-dialog and never when it is cancelled', async () => {
    await selectTournament();

    await clickAction('Ana Gil', 'registrations.action.reject');
    expect(element.querySelector('app-confirm-dialog')).not.toBeNull();
    (element.querySelector('.confirm-dialog__cancel') as HTMLButtonElement).click();
    await settle(fixture);
    expect(element.querySelector('app-confirm-dialog')).toBeNull();
    expect(repo.transition).not.toHaveBeenCalled();

    await clickAction('Ana Gil', 'registrations.action.reject');
    (element.querySelector('app-confirm-dialog app-async-button button') as HTMLButtonElement).click();
    await settle(fixture);
    expect(repo.transition).toHaveBeenCalledOnceWith('t-1', 'r-1', 'reject', 2);
    expect(element.querySelector('app-confirm-dialog')).toBeNull();
  });

  it('cancels a confirmed registration only after the confirm-dialog', async () => {
    await selectTournament();

    await clickAction('Dani Sosa', 'registrations.action.cancel');
    expect(repo.transition).not.toHaveBeenCalled();
    (element.querySelector('app-confirm-dialog app-async-button button') as HTMLButtonElement).click();
    await settle(fixture);
    expect(repo.transition).toHaveBeenCalledOnceWith('t-1', 'r-3', 'cancel', 2);
  });

  it('marks a payment as paid at once and as refunded only after the confirm-dialog', async () => {
    await selectTournament();

    await clickAction('Ana Gil', 'registrations.action.markPaid');
    expect(repo.setPayment).toHaveBeenCalledOnceWith('t-1', 'r-1', 'paid', 2);

    await clickAction('Caro Ruiz', 'registrations.action.markRefunded');
    expect(repo.setPayment).toHaveBeenCalledTimes(1);
    (element.querySelector('app-confirm-dialog app-async-button button') as HTMLButtonElement).click();
    await settle(fixture);
    expect(repo.setPayment).toHaveBeenCalledWith('t-1', 'r-2', 'refunded', 2);
  });

  it('asks the API for a status filter and filters payment locally', async () => {
    await selectTournament();
    repo.list.and.resolveTo({ items: [waitlistedPaid], capacity: buildCapacity() });

    component.onFiltersApplied({ status: 'waitlisted', paymentStatus: 'paid', search: '' });
    await settle(fixture);

    expect(repo.list.calls.mostRecent().args).toEqual(['t-1', 'waitlisted']);
    expect(element.querySelectorAll('app-data-table tbody tr').length).toBe(1);
    expect(rowOf('Caro Ruiz')).toBeTruthy();
  });

  it('opens the create panel for the picked tournament', async () => {
    await selectTournament();
    createButton().click();
    await settle(fixture);

    expect(element.querySelector('app-registration-form-panel')).not.toBeNull();
  });

  it('starts without a selection when the organization changes', async () => {
    await selectTournament();
    organizationChanged.update(v => v + 1);
    await settle(fixture);

    expect(component.tournamentControl.value).toBe('');
    expect(element.querySelector('[data-state="no-tournament"]')).not.toBeNull();
    expect(component.facade.registrations()).toEqual([]);
  });
});
