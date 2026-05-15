import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AdminComplexesPageComponent } from './admin-complexes-page.component';
import { ComplexesFacadeService } from './complexes-facade.service';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { AdminDashboardService } from '../../../../core/services/admin-dashboard.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Complex } from '../../../../core/models';

const seededComplexes: Complex[] = [
  { id: 'cx1', name: 'Club Pádel Norte', key: 'club_padel_norte', address: 'Av. Norte 100', location: 'Palermo', cityId: '', cityName: '', sortOrder: 1, preponderance: 1, sportsSupported: [], courtsCount: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cx2', name: 'Centro Sur', key: 'centro_sur', address: 'Av. Sur 200', location: 'Sur', cityId: '', cityName: '', sortOrder: 2, preponderance: 2, sportsSupported: [], courtsCount: 1, isActive: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

describe('AdminComplexesPageComponent', () => {
  let component: AdminComplexesPageComponent;
  let fixture: ComponentFixture<AdminComplexesPageComponent>;
  let facade: ComplexesFacadeService;
  let complexRepoSpy: jasmine.SpyObj<ApiComplexRepository>;
  let sportRepoSpy: jasmine.SpyObj<ApiSportRepository>;

  beforeEach(async () => {
    complexRepoSpy = jasmine.createSpyObj<ApiComplexRepository>('ApiComplexRepository', [
      'getAll', 'getForOrganization', 'getById', 'create', 'update', 'delete',
      'getExistingKeys', 'getCourtsByComplexId', 'createCourt', 'updateCourt',
      'deleteCourt', 'getAvailabilityByCourtId', 'saveAvailability'
    ]);
    complexRepoSpy.getAll.and.resolveTo([...seededComplexes]);
    complexRepoSpy.getExistingKeys.and.resolveTo(seededComplexes.map(c => c.key));
    complexRepoSpy.getCourtsByComplexId.and.resolveTo([]);
    complexRepoSpy.delete.and.resolveTo();

    sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', [
      'getAll', 'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant',
      'getById', 'create', 'update', 'delete', 'getExistingKeys'
    ]);
    sportRepoSpy.getAll.and.resolveTo([]);

    const activeOrgSpy = jasmine.createSpyObj<ActiveOrganizationService>('ActiveOrganizationService', [], {
      activeOrganizationId: signal(null),
      organizationChanged: signal(0)
    });

    const adminDashboardSpy = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['loadSummary']);
    adminDashboardSpy.loadSummary.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [AdminComplexesPageComponent, NoopAnimationsModule],
      providers: [
        ComplexesFacadeService,
        { provide: ApiComplexRepository, useValue: complexRepoSpy },
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: AdminDashboardService, useValue: adminDashboardSpy },
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
