import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexesFormPanelComponent } from './complexes-form-panel.component';
import { ComplexesFacadeService } from '../complexes-facade.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiComplexRepository } from '../../../../../core/repositories/api/api-complex.repository';
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';
import { ActiveOrganizationService } from '../../../../../core/services/active-organization.service';
import { AdminDashboardService } from '../../../../../core/services/admin-dashboard.service';
import { FILE_STORAGE_REPOSITORY } from '../../../../../core/repositories/file-storage.repository';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { Complex } from '../../../../../core/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

describe('ComplexesFormPanelComponent', () => {
  let component: ComplexesFormPanelComponent;
  let fixture: ComponentFixture<ComplexesFormPanelComponent>;
  let organizationId: ReturnType<typeof signal<string | null>>;

  const mockComplex: Complex = {
    id: 'cx1',
    name: 'Club Pádel Norte',
    key: 'club_padel_norte',
    address: 'Av. Libertador 1234',
    location: 'Palermo',
    cityId: 'city1',
    cityName: 'Buenos Aires',
    description: 'Club premium de pádel',
    sortOrder: 1,
    preponderance: 10,
    sportsSupported: ['sp1'],
    courtsCount: 4,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-01T14:30:00Z'
  };

  beforeEach(async () => {
    const complexRepoSpy = jasmine.createSpyObj<ApiComplexRepository>('ApiComplexRepository', [
      'getAll', 'getForOrganization', 'getById', 'create', 'update', 'delete',
      'getExistingKeys', 'getCourtsByComplexId', 'saveWithCourts', 'createCourt', 'updateCourt',
      'deleteCourt', 'getAvailabilityByCourtId', 'saveAvailability'
    ]);
    complexRepoSpy.getAll.and.resolveTo([]);
    complexRepoSpy.getExistingKeys.and.resolveTo([]);
    complexRepoSpy.getCourtsByComplexId.and.resolveTo([]);

    const sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', [
      'getAll', 'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant',
      'getById', 'create', 'update', 'delete', 'getExistingKeys'
    ]);
    sportRepoSpy.getAll.and.resolveTo([]);

    organizationId = signal<string | null>('org1');
    const activeOrgSpy = jasmine.createSpyObj<ActiveOrganizationService>('ActiveOrganizationService', [], {
      activeOrganizationId: organizationId,
      organizationChanged: signal(0)
    });

    const adminDashboardSpy = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['loadSummary']);
    adminDashboardSpy.loadSummary.and.returnValue(Promise.resolve());

    const fileStorageMock = {
      upload: jasmine.createSpy('upload').and.resolveTo('http://cdn/logo.png'),
      delete: jasmine.createSpy('delete').and.resolveTo(),
      buildTransformUrl: jasmine.createSpy('buildTransformUrl').and.callFake((url: string) => url)
    };

    await TestBed.configureTestingModule({
      imports: [ComplexesFormPanelComponent, NoopAnimationsModule],
      providers: [
        ComplexesFacadeService,
        { provide: ApiComplexRepository, useValue: complexRepoSpy },
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ActiveOrganizationService, useValue: activeOrgSpy },
        { provide: AdminDashboardService, useValue: adminDashboardSpy },
        { provide: FILE_STORAGE_REPOSITORY, useValue: fileStorageMock },
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexesFormPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no complex provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', null);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when complex provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', mockComplex);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockComplex.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('does not submit after the organization switches during async validation', async () => {
    const facade = TestBed.inject(ComplexesFacadeService);
    let resolveKey!: (exists: boolean) => void;
    spyOn(facade, 'checkKeyExists').and.returnValue(new Promise(resolve => { resolveKey = resolve; }));
    spyOn(facade, 'saveComplexWithCourts');
    fixture.detectChanges();
    component.form.get('name')?.setValue('New complex');
    const pending = component.onSave();
    organizationId.set('org2');
    resolveKey(false);
    await pending;
    expect(facade.saveComplexWithCourts).not.toHaveBeenCalled();
  });

  it('keeps court drafts and confirmed deletes local until one aggregate save succeeds', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    spyOn(facade, 'loadCourts').and.resolveTo(true);
    spyOn(facade, 'saveComplexWithCourts').and.resolveTo(false);
    fixture.detectChanges();
    await fixture.whenStable();
    component.onCourtSaved({ complexId: mockComplex.id, name: 'New court', isActive: true });
    await component.onSave();
    expect(facade.saveComplexWithCourts).toHaveBeenCalledTimes(1);
    expect(component.courtDrafts().length).toBe(1);
    expect(component.courtDrafts()[0].id).toBeNull();
  });

  it('rejects draft mutations during load and failure, including retry', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    let resolveLoad!: (value: boolean) => void;
    spyOn(facade, 'loadCourts').and.returnValue(new Promise(resolve => { resolveLoad = resolve; }));
    fixture.detectChanges();
    component.onCourtSaved({ complexId: 'cx1', name: 'Blocked', isActive: true });
    expect(component.courtDrafts()).toEqual([]);
    resolveLoad(false);
    await fixture.whenStable();
    component.onCourtSaved({ complexId: 'cx1', name: 'Blocked', isActive: true });
    expect(component.courtDrafts()).toEqual([]);
    const retry = component.retryCourtsLoad();
    component.onCourtSaved({ complexId: 'cx1', name: 'Blocked', isActive: true });
    expect(component.courtDrafts()).toEqual([]);
    resolveLoad(true);
    await retry;
  });

  it('renders court-load retry as an accessible non-submit button that retries once without saving', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    const loadCourts = spyOn(facade, 'loadCourts').and.resolveTo(false);
    const save = spyOn(facade, 'saveComplexWithCourts').and.resolveTo(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const alert = host.querySelector('.courts-load-alert');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.querySelector('.courts-load-alert__message')?.textContent?.trim()).toBeTruthy();
    const retryButton = alert?.querySelector('app-async-button button') as HTMLButtonElement | null;
    expect(retryButton).withContext('retry uses the shared async button').not.toBeNull();
    expect(retryButton!.type).toBe('button');
    expect(retryButton!.classList).toContain('async-btn--secondary');
    expect(retryButton!.textContent?.trim()).toBeTruthy();

    loadCourts.calls.reset();
    retryButton!.click();
    await fixture.whenStable();

    expect(loadCourts).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('spaces the main grid away from optional and technical sections inside the parent fieldset', () => {
    const host: HTMLElement = fixture.nativeElement;
    host.style.setProperty('--zh-space-lg', '24px');
    fixture.detectChanges();

    const fieldset = host.querySelector('fieldset.parent-fields') as HTMLElement;
    const children = Array.from(fieldset.children).map(child => child.tagName.toLowerCase());
    expect(children[0]).toBe('div');
    expect(fieldset.children[0].querySelector('app-active-toggle')).not.toBeNull();
    expect(children[1]).toBe('app-collapsible-section');

    const style = getComputedStyle(fieldset);
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('column');
    expect(style.rowGap).toBe('24px');
  });

  it('freezes court drafts while an aggregate save is pending', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    spyOn(facade, 'loadCourts').and.resolveTo(true);
    spyOn(facade, 'checkNameExists').and.resolveTo(false);
    spyOn(facade, 'checkSortOrderExists').and.resolveTo(false);
    let resolveSave!: (success: boolean) => void;
    spyOn(facade, 'saveComplexWithCourts').and.returnValue(new Promise(resolve => { resolveSave = resolve; }));
    fixture.detectChanges();
    await fixture.whenStable();
    component.onCourtSaved({ complexId: 'cx1', name: 'Included', isActive: true });
    const pending = component.onSave();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(facade.saveComplexWithCourts).toHaveBeenCalledTimes(1);
    component.onCourtSaved({ complexId: 'cx1', name: 'Late', isActive: true });
    component.onCourtDeleted(component.courtDrafts()[0].clientId);
    expect(component.courtDrafts().map(court => court.name)).toEqual(['Included']);
    expect(component.deletedCourtIds()).toEqual([]);
    resolveSave(false);
    await pending;
    component.onCourtSaved({ complexId: 'cx1', name: 'After failure', isActive: true });
    expect(component.courtDrafts().length).toBe(2);
  });

  it('locks parent editing during save and restores it after failure', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    spyOn(facade, 'loadCourts').and.resolveTo(true);
    spyOn(facade, 'checkNameExists').and.resolveTo(false);
    spyOn(facade, 'checkSortOrderExists').and.resolveTo(false);
    let resolveSave!: (success: boolean) => void;
    spyOn(facade, 'saveComplexWithCourts').and.returnValue(new Promise(resolve => { resolveSave = resolve; }));
    fixture.detectChanges();
    await fixture.whenStable();
    component.form.get('name')?.setValue('Changed name');
    const pending = component.onSave();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    expect(facade.saveComplexWithCourts).toHaveBeenCalledTimes(1);
    const root = fixture.nativeElement as HTMLElement;
    expect((root.querySelector('[formControlName="name"]') as HTMLInputElement).matches(':disabled')).toBeTrue();
    expect((root.querySelector('.btn-cancel') as HTMLButtonElement).disabled).toBeTrue();
    expect((root.querySelector('app-active-toggle input') as HTMLInputElement).disabled).toBeTrue();
    component.onActiveToggled(false);
    expect(component.form.get('isActive')?.value).toBeTrue();
    component.onLogoRemoved();
    component.onCancel();
    expect(component.form.get('logoImagePath')?.value).toBe(mockComplex.logoImagePath ?? '');
    resolveSave(false);
    await pending;
    fixture.detectChanges();
    expect(component.form.valid).toBeTrue();
    expect(component.form.get('key')?.disabled).toBeTrue();
    expect((root.querySelector('[formControlName="name"]') as HTMLInputElement).disabled).toBeFalse();
    expect((root.querySelector('.btn-cancel') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('preserves drafts and reports failure when aggregate save fails', async () => {
    fixture.componentRef.setInput('complex', mockComplex);
    const facade = TestBed.inject(ComplexesFacadeService);
    spyOn(facade, 'loadCourts').and.resolveTo(true);
    spyOn(facade, 'saveComplexWithCourts').and.resolveTo(false);
    spyOn(component.saved, 'emit');
    fixture.detectChanges();
    await fixture.whenStable();
    component.onCourtSaved({ complexId: 'cx1', name: 'Draft', isActive: true });
    await component.onSave();
    expect(component.courtDrafts()[0].name).toBe('Draft');
    expect(component.saved.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const form = component.form;
    form.get('name')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('Test Complex');
    form.get('key')?.setValue('test_complex');
    expect(form.valid).toBe(true);
  });

  it('should auto-generate key from name', () => {
    fixture.detectChanges();
    component.ngOnInit();

    component.form.get('name')?.setValue('Mi Complejo Nuevo');
    expect(component.form.get('key')?.value).toBe('mi_complejo_nuevo');
  });

  it('should set pendingLogoFile and update logoImagePath when logo is changed', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    const mockPreviewUrl = 'blob:http://localhost/test-preview';

    component.onLogoChanged({ file: mockFile, previewUrl: mockPreviewUrl });

    expect(component.pendingLogoFile()).toBe(mockFile);
    expect(component.form.get('logoImagePath')?.value).toBe(mockPreviewUrl);
    expect(component.form.dirty).toBe(true);
  });

  it('should clear pendingLogoFile and reset logoImagePath when logo is removed', () => {
    fixture.detectChanges();
    component.ngOnInit();

    // First set a file
    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    component.onLogoChanged({ file: mockFile, previewUrl: 'blob:http://localhost/test' });

    // Then remove it
    component.onLogoRemoved();

    expect(component.pendingLogoFile()).toBeNull();
    expect(component.form.get('logoImagePath')?.value).toBe('');
  });

  it('should return existing logo URL from complex as currentLogoUrl', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', { ...mockComplex, logoImagePath: 'https://cdn.example.com/logo.png' });
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.currentLogoUrl).toBe('https://cdn.example.com/logo.png');
  });

  it('should return null for currentLogoUrl when complex has no logo', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', mockComplex);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.currentLogoUrl).toBeNull();
  });

});
