import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSportsPageComponent } from './admin-sports-page.component';
import { SportsFacadeService } from './sports-facade.service';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';
import { ApiTournamentModalityRepository } from '../../../../core/repositories/api/api-tournament-modality.repository';
import { AuthService } from '../../../../core/auth/auth.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Sport } from '../../../../core/models';
import { signal } from '@angular/core';

const seededSports: Sport[] = [
  { id: 'sp1', name: 'Pádel', key: 'padel', icon: '🎾', iconSource: 'unicode', modalityIds: [], sortOrder: 1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
];

describe('AdminSportsPageComponent', () => {
  let component: AdminSportsPageComponent;
  let fixture: ComponentFixture<AdminSportsPageComponent>;
  let facade: SportsFacadeService;
  let repositorySpy: jasmine.SpyObj<ApiSportRepository>;

  beforeEach(async () => {
    repositorySpy = jasmine.createSpyObj<ApiSportRepository>('ApiSportRepository', [
      'getAll', 'getById', 'create', 'update', 'delete', 'getExistingKeys',
      'getForOrganization', 'getForTenant', 'setForOrganization', 'setForTenant'
    ]);
    repositorySpy.getAll.and.resolveTo([...seededSports]);
    repositorySpy.getExistingKeys.and.resolveTo(seededSports.map(s => s.key));

    const modalityRepoSpy = jasmine.createSpyObj<ApiTournamentModalityRepository>('ApiTournamentModalityRepository', ['getAll']);
    modalityRepoSpy.getAll.and.resolveTo([]);

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
      imports: [AdminSportsPageComponent],
      providers: [
        SportsFacadeService,
        { provide: ApiSportRepository, useValue: repositorySpy },
        { provide: ApiTournamentModalityRepository, useValue: modalityRepoSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: OrganizationContextService, useValue: orgContextSpy },
        { provide: TenantContextService, useValue: tenantContextSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSportsPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(SportsFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sports on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });
});
