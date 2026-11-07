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
import { ComplexesFormPanelComponent } from './complexes-form-panel/complexes-form-panel.component';
import { ComplexCourtsPanelComponent } from './complex-courts-panel/complex-courts-panel.component';
import { By } from '@angular/platform-browser';
import { FILE_STORAGE_REPOSITORY } from '../../../../core/repositories/file-storage.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { TRANSLATIONS } from '../../../../core/i18n/i18n.translations';

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
        { provide: FILE_STORAGE_REPOSITORY, useValue: { upload: jasmine.createSpy('upload'), buildTransformUrl: (url: string) => url } },
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

  it('remounts the form when switching complexes or editing to create', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.editingComplex.set(seededComplexes[0]);
    component.showFormPanel.set(true);
    fixture.detectChanges();
    const first = fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance as ComplexesFormPanelComponent;
    expect(first.form.get('name')?.value).toBe(seededComplexes[0].name);
    first.form.get('name')?.setValue('Unsaved');
    component.editingComplex.set(seededComplexes[1]);
    fixture.detectChanges();
    const second = fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance as ComplexesFormPanelComponent;
    expect(second).not.toBe(first);
    expect(second.form.get('name')?.value).toBe(seededComplexes[1].name);
    component.openCreate();
    fixture.detectChanges();
    const created = fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance as ComplexesFormPanelComponent;
    expect(created).not.toBe(second);
    expect(created.form.get('name')?.value).toBe('');
  });

  it('keeps the form mounted when header close is clicked during a pending child save, then closes after save', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.openCreate();
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance as ComplexesFormPanelComponent;
    form.savePending.set(true);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.complexes-page__form-panel-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.showFormPanel()).toBeTrue();
    expect(fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance).toBe(form);
    form.saved.emit();
    fixture.detectChanges();
    expect(component.showFormPanel()).toBeFalse();
  });

  it('does not replace a pending form via row edit, create, or courts actions', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.openEdit(component.tableData()[0]);
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance as ComplexesFormPanelComponent;
    form.savePending.set(true);
    component.onRowActionClicked({ action: 'edit', row: component.tableData()[1] });
    component.openCreate();
    component.onRowActionClicked({ action: 'courts', row: component.tableData()[1] });
    fixture.detectChanges();
    expect(component.editingComplex()?.id).toBe('cx1');
    expect(component.courtsComplexId()).toBeNull();
    expect(fixture.debugElement.query(By.directive(ComplexesFormPanelComponent)).componentInstance).toBe(form);
    form.savePending.set(false);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBeFalse();
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

  it('uses the separate court list only for persisted-court availability', async () => {
    complexRepoSpy.getCourtsByComplexId.and.resolveTo([
      { id: 'ct1', complexId: 'cx1', name: 'Court', isActive: true }
    ]);
    complexRepoSpy.getAvailabilityByCourtId.and.resolveTo([]);
    fixture.detectChanges();
    await fixture.whenStable();
    component.toggleCourtsPanel(component.tableData()[0]);
    await fixture.whenStable();
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.directive(ComplexCourtsPanelComponent)).componentInstance as ComplexCourtsPanelComponent;
    expect(panel.availabilityOnly()).toBeTrue();
    expect(panel.rowActions.map(action => action.action)).toEqual(['availability']);
    panel.onRowAction({ action: 'availability', row: panel.tableData[0] });
    expect(complexRepoSpy.getAvailabilityByCourtId).toHaveBeenCalledWith('ct1');
    expect(component.availabilityCourtId()).toBe('ct1');
    expect(complexRepoSpy.createCourt).not.toHaveBeenCalled();
    expect(complexRepoSpy.updateCourt).not.toHaveBeenCalled();
    expect(complexRepoSpy.deleteCourt).not.toHaveBeenCalled();
  });

  it('shows a scoped court alert with retry instead of the empty courts state when the court read fails', async () => {
    complexRepoSpy.getCourtsByComplexId.and.rejectWith(new Error('courts failure'));
    fixture.detectChanges();
    await fixture.whenStable();
    component.toggleCourtsPanel(component.tableData()[0]);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('.complexes-page__courts-section') as HTMLElement;
    const alert = section.querySelector('.complexes-page__courts-alert[role="alert"]') as HTMLElement;
    expect(alert).not.toBeNull();
    const message = alert.querySelector('.complexes-page__courts-alert-message')!.textContent!.trim();
    expect(message).toBe(TRANSLATIONS.es['admin.complexes.courts.listLoadError']);
    expect(message).not.toBe(TRANSLATIONS.es['admin.complexes.courts.loadError']);
    expect(section.querySelector('app-complex-courts-panel')).toBeNull();
    expect(section.querySelector('app-empty-state')).toBeNull();
    expect(facade.error()).toBeNull();
    expect(host.querySelector('zh-collection-view app-error-state')).toBeNull();
    expect(component.tableData().length).toBe(seededComplexes.length);

    const retry = alert.querySelector('button') as HTMLButtonElement;
    expect(retry.type).toBe('button');
    expect(retry.classList).toContain('async-btn--secondary');
    complexRepoSpy.getCourtsByComplexId.and.resolveTo([]);
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(complexRepoSpy.getCourtsByComplexId).toHaveBeenCalledTimes(2);
    expect(complexRepoSpy.getCourtsByComplexId.calls.mostRecent().args).toEqual(['cx1']);
    expect(section.querySelector('.complexes-page__courts-alert')).toBeNull();
    expect(section.querySelector('app-complex-courts-panel app-empty-state')).not.toBeNull();
  });

  it('shows the genuine empty courts state without an alert when the court read succeeds empty', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.toggleCourtsPanel(component.tableData()[0]);
    await fixture.whenStable();
    fixture.detectChanges();
    const section = (fixture.nativeElement as HTMLElement).querySelector('.complexes-page__courts-section') as HTMLElement;
    expect(section.querySelector('.complexes-page__courts-alert')).toBeNull();
    expect(section.querySelector('app-complex-courts-panel app-empty-state')).not.toBeNull();
  });

  it('does not carry a court failure into another complex', async () => {
    complexRepoSpy.getCourtsByComplexId.and.rejectWith(new Error('courts failure'));
    fixture.detectChanges();
    await fixture.whenStable();
    component.toggleCourtsPanel(component.tableData()[0]);
    await fixture.whenStable();
    let resolveCourts!: (courts: never[]) => void;
    complexRepoSpy.getCourtsByComplexId.and.returnValue(new Promise(resolve => { resolveCourts = resolve; }));
    component.toggleCourtsPanel(component.tableData()[1]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.complexes-page__courts-alert')).toBeNull();
    resolveCourts([]);
    await fixture.whenStable();
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
