import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SportsFormPanelComponent } from './sports-form-panel.component';
import { SportsFacadeService } from '../sports-facade.service';
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';
import { ApiTournamentModalityRepository } from '../../../../../core/repositories/api/api-tournament-modality.repository';
import { Sport } from '../../../../../core/models';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { signal } from '@angular/core';
import { AuthService } from '../../../../../core/auth/auth.service';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import { TenantContextService } from '../../../../../core/services/tenant-context.service';

describe('SportsFormPanelComponent', () => {
  let component: SportsFormPanelComponent;
  let fixture: ComponentFixture<SportsFormPanelComponent>;
  let facade: SportsFacadeService;

  const mockSportActive: Sport = {
    id: 'sp1',
    name: 'Pádel',
    key: 'padel',
    icon: '🎾',
    iconSource: 'unicode',
    modalityIds: [],
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockSportInactive: Sport = {
    ...mockSportActive,
    id: 'sp2',
    isActive: false
  };

  beforeEach(async () => {
    const modalityRepoSpy = jasmine.createSpyObj<ApiTournamentModalityRepository>(
      'ApiTournamentModalityRepository', ['getAll']
    );
    modalityRepoSpy.getAll.and.resolveTo([]);

    const sportRepoSpy = jasmine.createSpyObj<ApiSportRepository>(
      'ApiSportRepository', ['getAll', 'getById', 'create', 'update', 'delete',
        'getExistingKeys', 'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant']
    );
    sportRepoSpy.getAll.and.resolveTo([mockSportActive]);
    sportRepoSpy.getExistingKeys.and.resolveTo(['padel']);

    const authSpy = jasmine.createSpyObj<AuthService>('AuthService', [], {
      session: signal(null),
      currentUser: signal(null),
      isSystemAdmin: signal(true)
    });

    const orgContextSpy = jasmine.createSpyObj<OrganizationContextService>('OrganizationContextService', [], {
      organizationId: signal(null)
    });

    const tenantContextSpy = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], {
      tenantId: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [SportsFormPanelComponent],
      providers: [
        SportsFacadeService,
        { provide: ApiSportRepository, useValue: sportRepoSpy },
        { provide: ApiTournamentModalityRepository, useValue: modalityRepoSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: OrganizationContextService, useValue: orgContextSpy },
        { provide: TenantContextService, useValue: tenantContextSpy },
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SportsFormPanelComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(SportsFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no sport provided', () => {
    fixture.componentRef.setInput('sport', null);
    fixture.detectChanges();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when sport provided', () => {
    fixture.componentRef.setInput('sport', mockSportActive);
    fixture.detectChanges();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockSportActive.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('create mode keeps isActive default true', () => {
    fixture.componentRef.setInput('sport', null);
    fixture.detectChanges();

    expect(component.form.get('isActive')?.value).toBe(true);
  });

  // Bug #4 regression: edit mode with isActive:false must populate isActive:false
  it('edit mode with isActive:false must populate form isActive as false', () => {
    fixture.componentRef.setInput('sport', mockSportInactive);
    fixture.detectChanges();

    expect(component.form.get('isActive')?.value).toBe(false);
  });

  // Bug #4 regression: when sport signal changes from null to a sport with isActive:false,
  // the effect must re-run and update the form
  it('should re-populate isActive when sport signal changes after initial render', () => {
    // Start with no sport (create mode)
    fixture.componentRef.setInput('sport', null);
    fixture.detectChanges();
    expect(component.form.get('isActive')?.value).toBe(true);

    // Now simulate the parent setting an inactive sport (edit mode)
    fixture.componentRef.setInput('sport', mockSportInactive);
    fixture.detectChanges();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('isActive')?.value).toBe(false);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate form', () => {
    fixture.componentRef.setInput('sport', null);
    fixture.detectChanges();

    const form = component.form;
    form.get('name')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('Tennis');
    form.get('key')?.setValue('tennis');
    expect(form.valid).toBe(true);
  });
});
