import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComplexesPageComponent } from './admin-complexes-page.component';
import { ComplexesFacadeService } from './complexes-facade.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminComplexesPageComponent', () => {
  let component: AdminComplexesPageComponent;
  let fixture: ComponentFixture<AdminComplexesPageComponent>;
  let facade: ComplexesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComplexesPageComponent, NoopAnimationsModule],
      providers: [
        ApiComplexRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComplexesPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(ComplexesFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load complexes on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open create form', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingComplex()).toBeNull();
  });

  it('should close form panel', () => {
    component.openCreate();
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
  });

  it('should toggle courts panel', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const row = component.tableData()[0];
    component.toggleCourtsPanel(row);
    expect(component.courtsComplexId()).toBe(row.id);

    // Toggle off
    component.toggleCourtsPanel(row);
    expect(component.courtsComplexId()).toBeNull();
  });

  it('should apply filters', () => {
    fixture.detectChanges();
    component.onFiltersApplied({ name: 'Norte' });
    expect(component.tableData().length).toBeLessThanOrEqual(facade.entities().length);
  });

  it('should clear filters', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.onFiltersApplied({ name: 'Norte' });
    component.onFiltersCleared();
    expect(component.tableData().length).toBe(facade.entities().length);
  });

  it('should confirm delete', () => {
    component.confirmDelete({ id: 'cx1', name: 'Test', key: 'test', location: '', sortOrder: 1, preponderance: 1, courtsCount: 0, statusLabel: '', statusVariant: 'active', isActive: true });
    expect(component.showDeleteDialog()).toBe(true);
    expect(component.deletingId()).toBe('cx1');
  });

  it('should cancel delete', () => {
    component.confirmDelete({ id: 'cx1', name: 'Test', key: 'test', location: '', sortOrder: 1, preponderance: 1, courtsCount: 0, statusLabel: '', statusVariant: 'active', isActive: true });
    component.cancelDelete();
    expect(component.showDeleteDialog()).toBe(false);
    expect(component.deletingId()).toBeNull();
  });

  it('should handle selection changes', () => {
    const row = { id: 'cx1', name: 'Test', key: 'test', location: '', sortOrder: 1, preponderance: 1, courtsCount: 0, statusLabel: '', statusVariant: 'active', isActive: true };
    component.onSelectionChanged([row]);
    expect(component.hasSelection()).toBe(true);
  });

  it('should sort complexes', () => {
    spyOn(facade, 'applySortOption');
    component.onSorted({ key: 'name', direction: 'asc' });
    expect(facade.applySortOption).toHaveBeenCalledWith('name_asc');
  });
});
