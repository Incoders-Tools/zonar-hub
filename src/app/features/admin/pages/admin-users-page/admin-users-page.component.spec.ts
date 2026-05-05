import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsersPageComponent } from './admin-users-page.component';
import { UsersFacadeService } from './users-facade.service';
import { provideHttpClient } from '@angular/common/http';

describe('AdminUsersPageComponent', () => {
  let component: AdminUsersPageComponent;
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let facade: UsersFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent],
      providers: [UsersFacadeService, provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(UsersFacadeService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    const loadSpy = spyOn(facade, 'load');
    fixture.detectChanges();
    expect(loadSpy).toHaveBeenCalled();
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
    fixture.detectChanges();
    component.openCreateForm();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingUser()).toBeNull();
  });
});
