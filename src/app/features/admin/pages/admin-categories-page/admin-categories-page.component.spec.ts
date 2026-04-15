import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCategoriesPageComponent } from './admin-categories-page.component';
import { CategoryFacadeService } from './category-facade.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { signal } from '@angular/core';

describe('AdminCategoriesPageComponent', () => {
  let component: AdminCategoriesPageComponent;
  let fixture: ComponentFixture<AdminCategoriesPageComponent>;
  let facadeSpy: jasmine.SpyObj<CategoryFacadeService>;

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj('CategoryFacadeService', [
      'load', 'applyFilters', 'clearFilters', 'save', 'deleteCategory', 'bulkDelete', 'getExistingKeys'
    ], {
      categories: signal([]),
      filteredCategories: signal([]),
      loading: signal(false),
      error: signal(false),
      saving: signal(false),
      deleting: signal(false),
      filters: signal({})
    });

    await TestBed.configureTestingModule({
      imports: [AdminCategoriesPageComponent],
      providers: [I18nService]
    })
    .overrideComponent(AdminCategoriesPageComponent, {
      set: {
        providers: [{ provide: CategoryFacadeService, useValue: facadeSpy }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(facadeSpy.load).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingCategory()).toBeNull();
  });

  it('should open help dialog', () => {
    component.openHelp();
    expect(component.showHelpDialog()).toBe(true);
  });

  it('should close help dialog', () => {
    component.openHelp();
    component.closeHelp();
    expect(component.showHelpDialog()).toBe(false);
  });

  it('should apply filters through facade', () => {
    component.onFiltersApplied({ name: 'test', isActive: 'true' });
    expect(facadeSpy.applyFilters).toHaveBeenCalledWith({ name: 'test', isActive: 'true' });
  });

  it('should clear filters through facade', () => {
    component.onFiltersCleared();
    expect(facadeSpy.clearFilters).toHaveBeenCalled();
  });

  it('should open delete confirmation', () => {
    const row = { id: 'cat1', name: 'Test', shortName: 'T', key: 'test', level: 1, isActive: true, sortOrder: 1, statusLabel: 'active' };
    component.confirmDelete(row);
    expect(component.showDeleteDialog()).toBe(true);
    expect(component.deletingId()).toBe('cat1');
  });

  it('should cancel delete', () => {
    component.confirmDelete({ id: 'cat1', name: 'T', shortName: 'T', key: 't', level: 1, isActive: true, sortOrder: 1, statusLabel: '' });
    component.cancelDelete();
    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });

  it('should track selection changes', () => {
    const rows = [
      { id: 'cat1', name: 'A', shortName: 'A', key: 'a', level: 1, isActive: true, sortOrder: 1, statusLabel: '' },
      { id: 'cat2', name: 'B', shortName: 'B', key: 'b', level: 2, isActive: true, sortOrder: 2, statusLabel: '' }
    ];
    component.onSelectionChanged(rows);
    expect(component.hasSelection()).toBe(true);
    expect(component.selectedCategories().length).toBe(2);
  });

  it('should not open bulk delete without selection', () => {
    component.openBulkDelete();
    expect(component.showBulkDeleteDialog()).toBe(false);
  });

  it('should open bulk delete with selection', () => {
    component.onSelectionChanged([{ id: 'cat1', name: 'A', shortName: 'A', key: 'a', level: 1, isActive: true, sortOrder: 1, statusLabel: '' }]);
    component.openBulkDelete();
    expect(component.showBulkDeleteDialog()).toBe(true);
  });
});
