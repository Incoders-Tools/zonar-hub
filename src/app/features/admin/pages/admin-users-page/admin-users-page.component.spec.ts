import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { UsersFacadeService } from './users-facade.service';

describe('AdminUsersPageComponent', () => {
  let component: AdminUsersPageComponent;
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let facade: UsersFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent],
      providers: [UsersFacadeService]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(UsersFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    spyOn(facade, 'load');
    component.ngOnInit();
    expect(facade.load).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    spyOn(facade, 'applyFilters');
    component.onFiltersApplied({ search: 'john', roleId: 'role001' });
    expect(facade.applyFilters).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    spyOn(facade, 'clearFilters');
    component.onFiltersCleared();
    expect(facade.clearFilters).toHaveBeenCalled();
  });

  it('should open create form', () => {
    component.openCreateForm();
    expect(component.showFormDialog()).toBe(true);
    expect(component.editingUser()).toBeNull();
  });

  it('should open help dialog', () => {
    component.openHelp();
    expect(component.showHelpDialog()).toBe(true);
  });

  it('should close help dialog', () => {
    component.showHelpDialog.set(true);
    component.closeHelp();
    expect(component.showHelpDialog()).toBe(false);
  });
});
