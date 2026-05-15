import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAuditPageComponent } from './admin-audit-page.component';
import { AuditFacadeService } from './audit-facade.service';
import { By } from '@angular/platform-browser';

describe('AdminAuditPageComponent', () => {
  let component: AdminAuditPageComponent;
  let fixture: ComponentFixture<AdminAuditPageComponent>;
  let facade: AuditFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAuditPageComponent],
      providers: [AuditFacadeService]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(AuditFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load audit logs on init', () => {
    spyOn(facade, 'load');
    component.ngOnInit();
    expect(facade.load).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    spyOn(facade, 'applyFilters');
    component.onFiltersApplied({ action: 'CREATE', entityType: 'users' });
    expect(facade.applyFilters).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    spyOn(facade, 'clearFilters');
    component.onFiltersCleared();
    expect(facade.clearFilters).toHaveBeenCalled();
  });

  it('should handle row selection', () => {
    const rows = [{ id: 'log1', timestamp: '', userId: '', action: '', entityType: '', entityId: '', changes: '' }];
    component.onSelectionChanged(rows);
    expect(component.selectedLogs()).toEqual(rows);
  });

  it('should render listing via zh-collection-view', () => {
    fixture.detectChanges();
    const collectionView = fixture.debugElement.query(By.css('zh-collection-view'));
    expect(collectionView).toBeTruthy();
  });
});
