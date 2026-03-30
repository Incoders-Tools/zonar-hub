import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTournamentTypesPageComponent } from './admin-tournament-types-page.component';
import { TournamentTypesFacadeService } from './tournament-types-facade.service';
import { MockTournamentTypeRepository } from '../../../../core/repositories/mock/mock-tournament-type.repository';

describe('AdminTournamentTypesPageComponent', () => {
  let component: AdminTournamentTypesPageComponent;
  let fixture: ComponentFixture<AdminTournamentTypesPageComponent>;
  let facade: TournamentTypesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentTypesPageComponent],
      providers: [TournamentTypesFacadeService, MockTournamentTypeRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentTypesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(TournamentTypesFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load types on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormDialog()).toBe(true);
    expect(component.editingType()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormDialog.set(true);
    component.closeFormDialog();
    expect(component.showFormDialog()).toBe(false);
    expect(component.editingType()).toBeNull();
  });
});
