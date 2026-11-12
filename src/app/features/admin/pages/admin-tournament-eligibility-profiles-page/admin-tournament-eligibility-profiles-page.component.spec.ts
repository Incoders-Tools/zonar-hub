import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AdminTournamentEligibilityProfilesPageComponent } from './admin-tournament-eligibility-profiles-page.component';
import { TournamentEligibilityProfilesFacadeService } from './tournament-eligibility-profiles-facade.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { TournamentEligibilityProfile } from '../../../../core/models';

const profile = (overrides: Partial<TournamentEligibilityProfile> = {}): TournamentEligibilityProfile => ({
  id: 'ep-1', name: 'Damas', key: '', description: 'Solo damas', sortOrder: null, isActive: true, createdAt: '', updatedAt: '',
  slots: [{ slotNumber: 1, genderId: null, categoryId: null, minAge: null, maxAge: null, label: null, required: true }],
  ...overrides
});

describe('AdminTournamentEligibilityProfilesPageComponent', () => {
  let component: AdminTournamentEligibilityProfilesPageComponent;
  let fixture: ComponentFixture<AdminTournamentEligibilityProfilesPageComponent>;
  let facade: jasmine.SpyObj<TournamentEligibilityProfilesFacadeService>;
  const filteredProfiles = signal<TournamentEligibilityProfile[]>([]);
  const error = signal<string | null>(null);
  const organizationChanged = signal(0);

  beforeEach(async () => {
    filteredProfiles.set([profile(), profile({ id: 'ep-2', name: 'Mixto', isActive: false, slots: [] })]);
    error.set(null);
    facade = jasmine.createSpyObj<TournamentEligibilityProfilesFacadeService>('Facade',
      ['load', 'applyFilters', 'clearFilters', 'applySortOption', 'deleteProfile', 'bulkDelete', 'saveProfile', 'isNameTaken'], {
        filteredProfiles,
        loading: signal(false),
        saving: signal(false),
        deleting: signal(false),
        error,
        genders: signal([]),
        categories: signal([])
      });
    facade.deleteProfile.and.resolveTo(true);
    facade.bulkDelete.and.resolveTo(false);

    await TestBed.configureTestingModule({
      imports: [AdminTournamentEligibilityProfilesPageComponent],
      providers: [
        I18nService,
        provideNoopAnimations(),
        { provide: ActiveOrganizationService, useValue: { organizationChanged, activeOrganizationId: signal('org-1') } }
      ]
    })
    .overrideComponent(AdminTournamentEligibilityProfilesPageComponent, {
      set: { providers: [{ provide: TournamentEligibilityProfilesFacadeService, useValue: facade }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTournamentEligibilityProfilesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads once on init and again when the organization changes', () => {
    expect(facade.load).toHaveBeenCalledTimes(1);
    organizationChanged.update(v => v + 1);
    fixture.detectChanges();
    expect(facade.load).toHaveBeenCalledTimes(2);
  });

  it('renders each profile with its participant count and status', () => {
    expect(component.tableData().map(r => [r.name, r.slotCount, r.statusVariant])).toEqual([
      ['Damas', 1, 'active'], ['Mixto', 0, 'inactive']
    ]);
  });

  it('shows the translated load error', () => {
    error.set('common.forbidden');
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.tournament-eligibility-profiles-page__load-error');
    expect(alert).not.toBeNull();
    expect(alert!.textContent).not.toContain('common.forbidden');
  });

  it('includes the inactive-profile help section (L8)', () => {
    expect(component.helpSections.map(s => s.contentKey))
      .toContain('admin.tournament-eligibility-profiles.help.inactiveText');
  });

  it('forwards filters and the name sort to the facade', () => {
    component.onFiltersApplied({ name: 'dam', isActive: '' });
    expect(facade.applyFilters).toHaveBeenCalledWith({ name: 'dam', isActive: undefined });
    component.onSorted({ key: 'name', direction: 'desc' });
    expect(facade.applySortOption).toHaveBeenCalledWith('name_desc');
  });

  it('deletes only after confirmation and closes the dialog on success', async () => {
    component.onRowActionClicked({ action: 'delete', row: component.tableData()[0] });
    expect(component.showDeleteDialog()).toBeTrue();
    expect(facade.deleteProfile).not.toHaveBeenCalled();
    await component.executeDelete();
    expect(facade.deleteProfile).toHaveBeenCalledOnceWith('ep-1');
    expect(component.showDeleteDialog()).toBeFalse();
  });

  it('does not delete when the confirmation is cancelled', () => {
    component.confirmDelete(component.tableData()[0]);
    component.cancelDelete();
    expect(component.showDeleteDialog()).toBeFalse();
    expect(facade.deleteProfile).not.toHaveBeenCalled();
  });

  it('keeps the bulk dialog open when a profile is in use', async () => {
    component.onSelectionChanged(component.tableData());
    component.openBulkDelete();
    await component.executeBulkDelete();
    expect(facade.bulkDelete).toHaveBeenCalledOnceWith(['ep-1', 'ep-2']);
    expect(component.showBulkDeleteDialog()).toBeTrue();
  });

  it('opens the edit panel with the stored profile', () => {
    component.onRowActionClicked({ action: 'edit', row: component.tableData()[1] });
    expect(component.showFormPanel()).toBeTrue();
    expect(component.editingProfile()?.id).toBe('ep-2');
  });
});
