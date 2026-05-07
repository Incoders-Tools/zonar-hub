import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminTournamentsPageComponent } from './admin-tournaments-page.component';
import { TournamentsFacadeService } from './tournaments-facade.service';
import { MockTournamentAdminRepository } from '../../../../core/repositories/mock/mock-tournament-admin.repository';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiComplexRepository } from '../../../../core/repositories/api/api-complex.repository';
import { ApiCategoryRepository } from '../../../../core/repositories/api/api-category.repository';
import { ApiGenderRepository } from '../../../../core/repositories/api/api-gender.repository';
import { MockTournamentTypeRepository } from '../../../../core/repositories/tournament-admin.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';

describe('AdminTournamentsPageComponent', () => {
  let component: AdminTournamentsPageComponent;
  let fixture: ComponentFixture<AdminTournamentsPageComponent>;
  let facade: TournamentsFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentsPageComponent, NoopAnimationsModule],
      providers: [
        TournamentsFacadeService,
        MockTournamentAdminRepository,
        ApiComplexRepository,
        ApiCategoryRepository,
        ApiGenderRepository,
        MockTournamentTypeRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentsPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentsFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tournaments on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form panel for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingTournament()).toBeNull();
  });

  it('should close form panel', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingTournament()).toBeNull();
  });
});
