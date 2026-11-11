import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TournamentsFormComponent } from './tournaments-form.component';
import { TournamentsFacadeService } from '../tournaments-facade.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Tournament } from '../../../../../core/models';

const baseTournament: Tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', complexId: 'c-1', complexName: 'Arena', categoryId: '',
  categoryName: '', genderId: 'g-1', genderLabel: 'Mixto', tournamentTypeId: '', tournamentTypeName: '', sportId: 's-1',
  sportName: 'Pádel', modalityId: 'm-1', statusId: 'upcoming', statusLabel: 'upcoming', startDate: '2030-12-01',
  endDate: '2030-12-03', registrationStartDate: '', registrationEndDate: '', maxPairs: 16, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', key: 'copa_verano', isActive: true, selectedCourtIds: []
};

function createFacadeStub() {
  return {
    complexes: signal([{ id: 'c-1', name: 'Arena' }]),
    sports: signal([{ id: 's-1', name: 'Pádel', isActive: true }]),
    genders: signal([{ id: 'g-1', name: 'Mixto' }]),
    categories: signal([]),
    ruleSets: signal([]),
    modalities: signal([{ id: 'm-1', key: 'doubles', nameEs: 'Dobles', nameEn: 'Doubles', namePt: 'Duplas' }]),
    courtsForComplex: signal([]),
    loadingCourts: signal(false),
    getModalitiesForSport: () => [{ id: 'm-1', key: 'doubles', nameEs: 'Dobles', nameEn: 'Doubles', namePt: 'Duplas' }],
    getNextSortOrder: () => 1,
    computeStatus: () => ({ key: 'upcoming', labelKey: 'admin.tournaments.status.upcoming' }),
    loadCourtsForComplexes: jasmine.createSpy('loadCourtsForComplexes').and.resolveTo(),
    checkKeyExists: jasmine.createSpy('checkKeyExists').and.resolveTo(false),
    checkNameExists: jasmine.createSpy('checkNameExists').and.resolveTo(false),
    getComplexNames: () => 'Arena',
    getSportName: () => 'Pádel',
    getModalityName: () => 'Dobles',
    getRuleSetDescription: () => '',
    getGenderLabel: () => 'Mixto',
    getCategoryName: () => '',
    saveTournament: jasmine.createSpy('saveTournament').and.resolveTo(true),
    eligibilityProfiles: signal([
      { id: 'ep-1', name: 'Damas', key: '', description: null, sortOrder: null, isActive: true, createdAt: '', updatedAt: '' },
      { id: 'ep-2', name: 'Mixto', key: '', description: null, sortOrder: null, isActive: false, createdAt: '', updatedAt: '' }
    ]),
    loadEligibilityProfileId: jasmine.createSpy('loadEligibilityProfileId').and.resolveTo(null)
  };
}

describe('TournamentsFormComponent public visibility', () => {
  let fixture: ComponentFixture<TournamentsFormComponent>;
  let facade: ReturnType<typeof createFacadeStub>;
  let notification: jasmine.SpyObj<NotificationService>;

  async function render(tournament: Tournament | null, configure?: (stub: ReturnType<typeof createFacadeStub>) => void): Promise<void> {
    facade = createFacadeStub();
    configure?.(facade);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    await TestBed.configureTestingModule({
      imports: [TournamentsFormComponent],
      providers: [
        { provide: TournamentsFacadeService, useValue: facade },
        { provide: AuthService, useValue: { isSystemAdmin: signal(false) } },
        { provide: NotificationService, useValue: notification }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentsFormComponent);
    fixture.componentRef.setInput('tournament', tournament);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const visibilityToggle = () => host().querySelector<HTMLInputElement>('.tournaments-form__visibility input[type="checkbox"]')!;
  const shareLink = () => host().querySelector<HTMLAnchorElement>('.tournaments-form__share-link');
  const sharePending = () => host().querySelector<HTMLElement>('.tournaments-form__share-pending');
  const copyButton = () => host().querySelector<HTMLButtonElement>('.tournaments-form__share-copy');
  const expectedUrl = (slug: string) => `${window.location.origin}/tournaments/${slug}`;

  function toggleVisibility(): void {
    visibilityToggle().click();
    fixture.detectChanges();
  }

  async function submit(): Promise<void> {
    host().querySelector<HTMLButtonElement>('.tournaments-form__btn-save button')!.click();
    await fixture.whenStable();
  }

  it('renders the visibility toggle off for a new tournament with translated business help and no share link', async () => {
    await render(null);

    expect(visibilityToggle()).toBeTruthy();
    expect(visibilityToggle().checked).toBeFalse();
    const help = host().querySelector<HTMLElement>('.tournaments-form__visibility-help')!;
    expect(help.textContent!.trim().length).toBeGreaterThan(0);
    expect(help.textContent).not.toContain('admin.tournaments');
    expect(shareLink()).toBeNull();
    expect(sharePending()).toBeNull();
  });

  it('explains that the link is generated on save when a new tournament is turned public', async () => {
    await render(null);

    toggleVisibility();

    expect(visibilityToggle().checked).toBeTrue();
    expect(sharePending()).toBeTruthy();
    expect(sharePending()!.textContent).not.toContain('admin.tournaments');
    expect(shareLink()).toBeNull();
  });

  it('shows the exact share URL for a saved public tournament with a slug', async () => {
    await render({ ...baseTournament, isPublic: true, publicSlug: 'copa-verano-a1b2c3' });

    expect(visibilityToggle().checked).toBeTrue();
    expect(shareLink()!.textContent!.trim()).toBe(expectedUrl('copa-verano-a1b2c3'));
    expect(shareLink()!.getAttribute('href')).toBe(expectedUrl('copa-verano-a1b2c3'));
    expect(shareLink()!.getAttribute('rel')).toBe('noopener noreferrer');
    expect(sharePending()).toBeNull();
  });

  it('shows the generated-on-save note for a public tournament that has no slug yet', async () => {
    await render({ ...baseTournament, isPublic: true });

    expect(sharePending()).toBeTruthy();
    expect(shareLink()).toBeNull();
  });

  it('shows nothing for a private tournament and the same link again when it is turned public', async () => {
    await render({ ...baseTournament, isPublic: false, publicSlug: 'copa-verano-a1b2c3' });

    expect(shareLink()).toBeNull();
    expect(sharePending()).toBeNull();

    toggleVisibility();

    expect(shareLink()!.textContent!.trim()).toBe(expectedUrl('copa-verano-a1b2c3'));
  });

  it('copies the share URL to the clipboard and confirms success', async () => {
    await render({ ...baseTournament, isPublic: true, publicSlug: 'copa-verano-a1b2c3' });
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();

    copyButton()!.click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledOnceWith(expectedUrl('copa-verano-a1b2c3'));
    expect(notification.success).toHaveBeenCalledOnceWith('admin.tournaments.share.copySuccess');
  });

  it('reports an error when the clipboard is unavailable', async () => {
    await render({ ...baseTournament, isPublic: true, publicSlug: 'copa-verano-a1b2c3' });
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('denied'));

    copyButton()!.click();
    await fixture.whenStable();

    expect(notification.error).toHaveBeenCalledOnceWith('admin.tournaments.share.copyError');
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('submits isPublic true after the operator turns visibility on', async () => {
    await render({ ...baseTournament, isPublic: false });

    toggleVisibility();
    await submit();

    expect(facade.saveTournament).toHaveBeenCalledTimes(1);
    expect(facade.saveTournament.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ id: 't-1', isPublic: true }));
  });

  it('submits isPublic false after the operator turns visibility off', async () => {
    await render({ ...baseTournament, isPublic: true, publicSlug: 'copa-verano-a1b2c3' });

    toggleVisibility();
    await submit();

    const payload = facade.saveTournament.calls.mostRecent().args[0];
    expect(payload.isPublic).toBeFalse();
  });

  describe('eligibility profile picker (R2b, L8)', () => {
    it('lists the organization profiles, marks inactive ones and explains the inactive fallback', async () => {
      await render(null);
      const component = fixture.componentInstance;
      expect(component.eligibilityProfileOptions().map(o => o.value)).toEqual(['ep-1', 'ep-2']);
      expect(component.eligibilityProfileOptions()[0].label).toBe('Damas');
      expect(component.eligibilityProfileOptions()[1].label).not.toBe('Mixto');
      expect(host().querySelector('.tournaments-form__eligibility-profile zh-select')).toBeTruthy();
      expect(facade.loadEligibilityProfileId).not.toHaveBeenCalled();
    });

    it('loads the assigned profile of an existing tournament', async () => {
      await render({ ...baseTournament }, stub => stub.loadEligibilityProfileId.and.resolveTo('ep-1'));
      expect(facade.loadEligibilityProfileId).toHaveBeenCalledOnceWith('t-1');
      expect(fixture.componentInstance.eligibilityProfileControl.enabled).toBeTrue();
      expect(fixture.componentInstance.eligibilityProfileControl.value).toBe('ep-1');
    });

    it('sends no profile change when the choice is untouched', async () => {
      await render({ ...baseTournament }, stub => stub.loadEligibilityProfileId.and.resolveTo('ep-1'));
      await submit();
      expect(facade.saveTournament.calls.mostRecent().args[1]).toBeUndefined();
    });

    it('sends the new profile, or null to clear it, when the choice changed', async () => {
      await render({ ...baseTournament }, stub => stub.loadEligibilityProfileId.and.resolveTo('ep-1'));
      fixture.componentInstance.eligibilityProfileControl.setValue('ep-2');
      await submit();
      expect(facade.saveTournament.calls.mostRecent().args[1]).toBe('ep-2');

      fixture.componentInstance.eligibilityProfileControl.setValue('');
      await submit();
      expect(facade.saveTournament.calls.mostRecent().args[1]).toBeNull();
    });

    it('keeps the picker disabled and never clears the assignment when it cannot be read', async () => {
      await render({ ...baseTournament },
        stub => stub.loadEligibilityProfileId.and.rejectWith(new Error('tournaments.errors.not_found')));
      const component = fixture.componentInstance;
      expect(component.eligibilityProfileControl.disabled).toBeTrue();
      expect(component.eligibilityProfileLoadError()).toBe('tournaments.errors.not_found');
      await submit();
      expect(facade.saveTournament.calls.mostRecent().args[1]).toBeUndefined();
    });
  });
});
