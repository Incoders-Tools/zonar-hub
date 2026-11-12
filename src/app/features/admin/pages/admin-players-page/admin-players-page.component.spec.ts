import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { AdminPlayersPageComponent, PlayerRow } from './admin-players-page.component';
import { PlayerFacadeService } from './player-facade.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { Player } from '../../../../core/models';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1', firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', documentId: '301', genderId: 'g-f',
  genderLabel: 'Femenino', categoryId: 'c-4', categoryName: 'Cuarta', club: 'Norte', birthDate: '1990-05-20',
  isActive: true, createdAt: '', ...overrides
});

const row = (overrides: Partial<PlayerRow> = {}): PlayerRow => ({
  id: 'p1', name: 'Ana Gil', email: 'ana@club.test', documentId: '301', categoryName: 'Cuarta', genderLabel: 'Femenino',
  club: 'Norte', birthDate: '1990-05-20', isActive: true, statusLabel: 'admin.players.status.active', statusVariant: 'active',
  ...overrides
});

describe('AdminPlayersPageComponent', () => {
  let component: AdminPlayersPageComponent;
  let fixture: ComponentFixture<AdminPlayersPageComponent>;
  let facadeSpy: jasmine.SpyObj<PlayerFacadeService>;
  const players = signal<Player[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const organizationChanged = signal(0);

  beforeEach(async () => {
    players.set([player(), player({ id: 'p2', firstName: 'Bea', isActive: false })]);
    loading.set(false);
    error.set(null);
    facadeSpy = jasmine.createSpyObj('PlayerFacadeService', [
      'load', 'goToPage', 'applyFilters', 'clearFilters', 'save', 'setActive'
    ], {
      players,
      page: signal(1),
      pageSize: 25,
      totalCount: signal(2),
      loading,
      error,
      saving: signal(false),
      updatingStatus: signal(false),
      filters: signal({}),
      categories: signal([]),
      genders: signal([])
    });
    facadeSpy.setActive.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AdminPlayersPageComponent],
      providers: [
        I18nService,
        provideNoopAnimations(),
        provideHttpClient(),
        { provide: ActiveOrganizationService, useValue: { organizationChanged, activeOrganizationId: signal('org-1') } }
      ]
    })
    .overrideComponent(AdminPlayersPageComponent, {
      set: { providers: [{ provide: PlayerFacadeService, useValue: facadeSpy }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPlayersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the first server page once on init and again when the organization changes', () => {
    expect(facadeSpy.goToPage).toHaveBeenCalledOnceWith(1);
    component.openCreate();
    organizationChanged.update(v => v + 1);
    fixture.detectChanges();
    expect(facadeSpy.goToPage).toHaveBeenCalledTimes(2);
    expect(component.showFormPanel()).toBeFalse();
  });

  it('renders one row per player of the page with its status', () => {
    expect(component.tableData().map(r => [r.name, r.statusVariant])).toEqual([['Ana Gil', 'active'], ['Bea Gil', 'inactive']]);
    expect(component.tableData()[0].club).toBe('Norte');
  });

  it('shows the translated load error above the list', () => {
    error.set('common.forbidden');
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.players-page__load-error');
    expect(alert).not.toBeNull();
    expect(alert!.textContent).not.toContain('common.forbidden');
  });

  it('forwards search and status to the server and clears the selection', () => {
    component.onSelectionChanged([row()]);
    component.onFiltersApplied({ search: '  gil ', isActive: 'true' });
    expect(facadeSpy.applyFilters).toHaveBeenCalledWith({ search: 'gil', isActive: 'true' });
    expect(component.selectedPlayers()).toEqual([]);

    component.onFiltersCleared();
    expect(facadeSpy.clearFilters).toHaveBeenCalled();
  });

  it('requests the selected page from the server', () => {
    component.onPageChange(2);
    expect(facadeSpy.goToPage).toHaveBeenCalledWith(2);
  });

  it('offers deactivate for active rows and reactivate for inactive rows, never delete', () => {
    expect(component.playerRowActionsFilter(row()).map(a => a.action)).toEqual(['edit', 'deactivate']);
    expect(component.playerRowActionsFilter(row({ isActive: false })).map(a => a.action)).toEqual(['edit', 'reactivate']);
    expect(component.playerRowActions.some(a => a.action === 'delete')).toBeFalse();
  });

  it('deactivates only after confirmation', async () => {
    component.onRowActionClicked({ action: 'deactivate', row: row() });
    expect(component.showDeactivateDialog()).toBeTrue();
    expect(facadeSpy.setActive).not.toHaveBeenCalled();

    await component.executeDeactivate();
    expect(facadeSpy.setActive).toHaveBeenCalledOnceWith(['p1'], false);
    expect(component.showDeactivateDialog()).toBeFalse();
  });

  it('does not deactivate when the confirmation is cancelled', () => {
    component.confirmDeactivate(row());
    component.cancelDeactivate();
    expect(component.showDeactivateDialog()).toBeFalse();
    expect(component.deactivatingId()).toBeNull();
    expect(facadeSpy.setActive).not.toHaveBeenCalled();
  });

  it('keeps the dialog open when the deactivation fails', async () => {
    facadeSpy.setActive.and.resolveTo(false);
    component.confirmDeactivate(row());
    await component.executeDeactivate();
    expect(component.showDeactivateDialog()).toBeTrue();
  });

  it('reactivates an inactive player without confirmation', () => {
    component.onRowActionClicked({ action: 'reactivate', row: row({ id: 'p2', isActive: false }) });
    expect(facadeSpy.setActive).toHaveBeenCalledOnceWith(['p2'], true);
  });

  it('bulk-deactivates only the active players of the selection after confirmation', async () => {
    component.openBulkDeactivate();
    expect(component.showBulkDeactivateDialog()).toBeFalse();

    component.onSelectionChanged([row(), row({ id: 'p2', isActive: false })]);
    component.openBulkDeactivate();
    expect(component.showBulkDeactivateDialog()).toBeTrue();

    await component.executeBulkDeactivate();
    expect(facadeSpy.setActive).toHaveBeenCalledOnceWith(['p1'], false);
    expect(component.selectedPlayers()).toEqual([]);
  });

  it('opens the edit panel with the stored player', () => {
    component.onRowActionClicked({ action: 'edit', row: row() });
    expect(component.showFormPanel()).toBeTrue();
    expect(component.editingPlayer()?.id).toBe('p1');
    component.closeFormPanel();
    expect(component.editingPlayer()).toBeNull();
  });
});
