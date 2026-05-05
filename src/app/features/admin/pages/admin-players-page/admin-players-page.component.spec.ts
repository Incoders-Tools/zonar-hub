import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AdminPlayersPageComponent } from './admin-players-page.component';
import { PlayerFacadeService } from './player-facade.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

describe('AdminPlayersPageComponent', () => {
  let component: AdminPlayersPageComponent;
  let fixture: ComponentFixture<AdminPlayersPageComponent>;
  let facadeSpy: jasmine.SpyObj<PlayerFacadeService>;

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('PlayerFacadeService', [
      'load', 'applyFilters', 'clearFilters', 'save', 'deletePlayer', 'bulkDelete', 'applySortOption'
    ], {
      players: signal([]),
      filteredPlayers: signal([]),
      loading: signal(false),
      error: signal(false),
      saving: signal(false),
      deleting: signal(false),
      filters: signal({}),
      categories: signal([]),
      genders: signal([]),
      sports: signal([])
    });

    await TestBed.configureTestingModule({
      imports: [AdminPlayersPageComponent],
      providers: [I18nService, provideNoopAnimations(), provideHttpClient()]
    })
    .overrideComponent(AdminPlayersPageComponent, {
      set: {
        providers: [{ provide: PlayerFacadeService, useValue: facadeSpy }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPlayersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load players on init', () => {
    expect(facadeSpy.load).toHaveBeenCalled();
  });

  it('should open create form panel', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingPlayer()).toBeNull();
  });

  it('should close form panel', () => {
    component.openCreate();
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingPlayer()).toBeNull();
  });

  it('should apply filters through facade', () => {
    component.onFiltersApplied({ search: 'test', isActive: 'true' });
    expect(facadeSpy.applyFilters).toHaveBeenCalledWith({
      search: 'test',
      genderId: undefined,
      categoryId: undefined,
      sportId: undefined,
      isActive: 'true'
    });
  });

  it('should clear filters through facade', () => {
    component.onFiltersCleared();
    expect(facadeSpy.clearFilters).toHaveBeenCalled();
  });

  it('should open delete confirmation', () => {
    const row = {
      id: 'p1', name: 'John Doe', email: 'john@test.com',
      categoryName: 'A', genderLabel: 'Male', sportName: 'Padel',
      ranking: 1, isActive: true, statusLabel: 'active', statusVariant: 'active'
    };
    component.confirmDelete(row);
    expect(component.showDeleteDialog()).toBe(true);
    expect(component.deletingId()).toBe('p1');
  });

  it('should cancel delete', () => {
    const row = {
      id: 'p1', name: 'John Doe', email: 'john@test.com',
      categoryName: 'A', genderLabel: 'Male', sportName: 'Padel',
      ranking: 1, isActive: true, statusLabel: '', statusVariant: 'active'
    };
    component.confirmDelete(row);
    component.cancelDelete();
    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });

  it('should track selection changes', () => {
    const rows = [
      { id: 'p1', name: 'A', email: 'a@test.com', categoryName: 'A', genderLabel: 'M', sportName: 'P', ranking: 1, isActive: true, statusLabel: '', statusVariant: 'active' },
      { id: 'p2', name: 'B', email: 'b@test.com', categoryName: 'B', genderLabel: 'F', sportName: 'P', ranking: 2, isActive: true, statusLabel: '', statusVariant: 'active' }
    ];
    component.onSelectionChanged(rows);
    expect(component.hasSelection()).toBe(true);
    expect(component.selectedPlayers().length).toBe(2);
  });

  it('should not open bulk delete without selection', () => {
    component.openBulkDelete();
    expect(component.showBulkDeleteDialog()).toBe(false);
  });

  it('should open bulk delete with selection', () => {
    component.onSelectionChanged([
      { id: 'p1', name: 'A', email: 'a@test.com', categoryName: 'A', genderLabel: 'M', sportName: 'P', ranking: 1, isActive: true, statusLabel: '', statusVariant: 'active' }
    ]);
    component.openBulkDelete();
    expect(component.showBulkDeleteDialog()).toBe(true);
  });
});
