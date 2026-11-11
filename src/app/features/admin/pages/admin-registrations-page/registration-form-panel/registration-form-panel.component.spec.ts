import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RegistrationFormPanelComponent } from './registration-form-panel.component';
import { RegistrationFacadeService } from '../registration-facade.service';
import { ApiTournamentAdminRepository } from '../../../../../core/repositories/api/api-tournament-admin.repository';
import { ApiEligibilityProfileRepository } from '../../../../../core/repositories/api/api-eligibility-profile.repository';
import { ApiCategoryRepository } from '../../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../../core/repositories/api/api-gender.repository';
import { ParticipantSearchComponent } from '../../../../../shared/components/participant-search/participant-search.component';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { Category, Gender, Player, Tournament, TournamentEligibilityProfile } from '../../../../../core/models';
import { buildCapacity, buildRegistration } from '../../../../../core/models/tournament-registration.testing';

const tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', complexId: 'c-1', complexName: 'Arena', categoryId: 'c-4',
  categoryName: 'Cuarta', genderId: 'g-f', genderLabel: 'Femenino', tournamentTypeId: 'tt-1', tournamentTypeName: '',
  sportId: 's-1', sportName: '', statusId: 'upcoming', statusLabel: '', startDate: '2030-12-01', endDate: '2030-12-03',
  registrationStartDate: '', registrationEndDate: '', maxPairs: 8, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', isActive: true, isPublic: true, modalityKey: 'doubles'
} as Tournament;

const category = (id: string, level: number): Category =>
  ({ id, name: id, shortName: id, key: id, level, isActive: true, sortOrder: level, createdAt: '', updatedAt: '' });
const gender = (id: string, key: string): Gender =>
  ({ id, name: key, key, isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' });

const categories = [category('c-3', 3), category('c-4', 4), category('c-6', 6)];
const genders = [gender('g-f', 'female'), gender('g-m', 'male'), gender('g-x', 'mixed')];

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p-1', firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', documentId: '301', genderId: 'g-f',
  genderLabel: 'Femenino', categoryId: 'c-4', categoryName: 'Cuarta', club: 'Norte', birthDate: '1990-05-20',
  isActive: true, createdAt: '', ...overrides
} as Player);

const ana = player();
const bea = player({ id: 'p-2', firstName: 'Bea', lastName: 'Paz', categoryId: 'c-3' });
const carlos = player({ id: 'p-9', firstName: 'Carlos', lastName: 'Ríos', genderId: 'g-m' });

const settle = async (fixture: ComponentFixture<unknown>) => {
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }
};

describe('RegistrationFormPanelComponent', () => {
  let fixture: ComponentFixture<RegistrationFormPanelComponent>;
  let component: RegistrationFormPanelComponent;
  let element: HTMLElement;
  let facade: { create: jasmine.Spy };
  let tournamentRepo: { getEligibilityProfileId: jasmine.Spy };
  let profileRepo: { getById: jasmine.Spy };
  let i18n: I18nService;

  beforeEach(async () => {
    facade = { create: jasmine.createSpy('create').and.resolveTo(true) };
    tournamentRepo = { getEligibilityProfileId: jasmine.createSpy('getEligibilityProfileId').and.resolveTo(null) };
    profileRepo = { getById: jasmine.createSpy('getById').and.resolveTo(undefined) };

    await TestBed.configureTestingModule({
      imports: [RegistrationFormPanelComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RegistrationFacadeService, useValue: facade },
        { provide: ApiTournamentAdminRepository, useValue: tournamentRepo },
        { provide: ApiEligibilityProfileRepository, useValue: profileRepo },
        { provide: ApiCategoryRepository, useValue: { getAll: () => Promise.resolve(categories) } },
        { provide: ApiGenderRepository, useValue: { getAll: () => Promise.resolve(genders) } }
      ]
    }).compileComponents();
    i18n = TestBed.inject(I18nService);
  });

  async function render(inputs: { tournament?: Tournament; capacity?: ReturnType<typeof buildCapacity> | null } = {}): Promise<void> {
    fixture = TestBed.createComponent(RegistrationFormPanelComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('tournament', inputs.tournament ?? tournament);
    fixture.componentRef.setInput('capacity', inputs.capacity === undefined ? buildCapacity() : inputs.capacity);
    fixture.componentRef.setInput('registrations', [buildRegistration({
      id: 'r-7', status: 'confirmed',
      participants: [{ slotNumber: 1, playerId: 'p-7', firstName: 'Lu', lastName: 'Ok', displayName: 'Lu Ok', club: null }]
    })]);
    fixture.detectChanges();
    await settle(fixture);
  }

  function searches(): ParticipantSearchComponent[] {
    return fixture.debugElement.queryAll(By.directive(ParticipantSearchComponent)).map(d => d.componentInstance);
  }

  async function pick(slotNumber: number, chosen: Player): Promise<void> {
    searches().find(s => s.slotNumber() === slotNumber)!.playerSelected.emit({ slotNumber, player: chosen });
    await settle(fixture);
  }

  function saveButton(): HTMLButtonElement {
    return element.querySelector('[data-action="save"] button') as HTMLButtonElement;
  }

  function slotErrors(): string {
    return Array.from(element.querySelectorAll('.registration-form__slot-errors')).map(e => e.textContent ?? '').join(' ');
  }

  it('shows the tournament own slots (doubles, gender and category) without a profile', async () => {
    await render();

    expect(tournamentRepo.getEligibilityProfileId).toHaveBeenCalledOnceWith('t-1');
    expect(searches().map(s => s.slotNumber())).toEqual([1, 2]);
    expect(searches()[0].eligibilitySlot()).toEqual(jasmine.objectContaining({ genderId: 'g-f', categoryId: 'c-4', required: true }));
    expect(element.textContent).toContain('Copa Verano');
  });

  it('uses the slots of the assigned active profile', async () => {
    const profile = {
      id: 'ep-1', name: 'Single', key: 'single', description: null, sortOrder: 1, isActive: true, createdAt: '', updatedAt: '',
      slots: [{ slotNumber: 1, genderId: null, categoryId: null, minAge: 18, maxAge: null, label: 'Titular', required: true }]
    } as TournamentEligibilityProfile;
    tournamentRepo.getEligibilityProfileId.and.resolveTo('ep-1');
    profileRepo.getById.and.resolveTo(profile);
    await render();

    expect(profileRepo.getById).toHaveBeenCalledOnceWith('ep-1');
    expect(searches().map(s => s.slotNumber())).toEqual([1]);
  });

  it('ignores an inactive profile and applies the tournament rules (L8)', async () => {
    tournamentRepo.getEligibilityProfileId.and.resolveTo('ep-1');
    profileRepo.getById.and.resolveTo({
      id: 'ep-1', name: 'Off', key: 'off', description: null, sortOrder: 1, isActive: false, createdAt: '', updatedAt: '',
      slots: [{ slotNumber: 1, genderId: null, categoryId: null, minAge: null, maxAge: null, label: null, required: true }]
    } as TournamentEligibilityProfile);
    await render();

    expect(searches().map(s => s.slotNumber())).toEqual([1, 2]);
  });

  it('shows the translated error when the rules cannot be read and keeps save disabled', async () => {
    tournamentRepo.getEligibilityProfileId.and.rejectWith(new Error('tournaments.errors.forbidden'));
    await render();

    expect(element.querySelector('[data-state="rules-error"]')?.textContent?.trim()).toBe(i18n.translate('tournaments.errors.forbidden'));
    expect(searches().length).toBe(0);
    expect(saveButton().disabled).toBeTrue();
  });

  it('keeps save disabled with its explanation until every required slot has an eligible player', async () => {
    await render();
    expect(saveButton().disabled).toBeTrue();
    expect(element.querySelector('[data-hint="save-disabled"]')).not.toBeNull();

    await pick(1, ana);
    expect(saveButton().disabled).toBeTrue();

    await pick(2, bea);
    expect(saveButton().disabled).toBeFalse();
    expect(element.querySelector('[data-hint="save-disabled"]')).toBeNull();
  });

  it('shows the eligibility error of a player outside the tournament gender', async () => {
    await render();
    await pick(1, ana);
    await pick(2, carlos);

    expect(slotErrors()).toContain(i18n.translate('validation.eligibility.genderMismatch'));
    expect(saveButton().disabled).toBeTrue();
  });

  it('admits any gender in a mixed tournament', async () => {
    await render({ tournament: { ...tournament, genderId: 'g-x' } });
    await pick(1, ana);
    await pick(2, carlos);

    expect(slotErrors()).toBe('');
    expect(saveButton().disabled).toBeFalse();
  });

  it('marks players of other slots and players already registered as unavailable', async () => {
    await render();
    await pick(1, ana);

    const second = searches().find(s => s.slotNumber() === 2)!;
    expect([...second.selectedPlayerIds()].sort()).toEqual(['p-1', 'p-7']);
  });

  it('refuses a confirmed registration while the places are taken, with its explanation', async () => {
    await render({ capacity: buildCapacity({ confirmed: 8, placesLeft: 0 }) });
    await pick(1, ana);
    await pick(2, bea);
    expect(saveButton().disabled).toBeFalse();

    (element.querySelector('[data-field="status-confirmed"]') as HTMLInputElement).click();
    await settle(fixture);

    expect(element.querySelector('[data-hint="capacity-full"]')?.textContent?.trim())
      .toBe(i18n.translate('registrations.capacity.fullExplanation'));
    expect(saveButton().disabled).toBeTrue();
  });

  it('creates the registration with the players in slot order and emits saved', async () => {
    await render();
    const saved = jasmine.createSpy('saved');
    component.saved.subscribe(saved);
    await pick(2, bea);
    await pick(1, ana);
    const email = element.querySelector('#registration-contact-email') as HTMLInputElement;
    email.value = 'capitana@club.test';
    email.dispatchEvent(new Event('input'));
    await settle(fixture);

    saveButton().click();
    await settle(fixture);

    expect(facade.create).toHaveBeenCalledOnceWith({
      participants: [{ slotNumber: 1, playerId: 'p-1' }, { slotNumber: 2, playerId: 'p-2' }],
      status: 'pending',
      contactEmail: 'capitana@club.test',
      notes: '',
      publicNameConsent: false
    });
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it('stays open when the API refuses the registration', async () => {
    facade.create.and.resolveTo(false);
    await render();
    const saved = jasmine.createSpy('saved');
    component.saved.subscribe(saved);
    await pick(1, ana);
    await pick(2, bea);

    saveButton().click();
    await settle(fixture);

    expect(facade.create).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
  });

  it('blocks an invalid contact email', async () => {
    await render();
    await pick(1, ana);
    await pick(2, bea);
    const email = element.querySelector('#registration-contact-email') as HTMLInputElement;
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input'));
    await settle(fixture);

    expect(saveButton().disabled).toBeTrue();
  });

  it('emits cancelled', async () => {
    await render();
    const cancelled = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(cancelled);

    (element.querySelector('.registration-form__btn-cancel') as HTMLButtonElement).click();

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(facade.create).not.toHaveBeenCalled();
  });
});
