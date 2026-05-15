import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAppLogsPageComponent } from './admin-app-logs-page.component';
import { AppLogsFacadeService } from './app-logs-facade.service';
import { By } from '@angular/platform-browser';

describe('AdminAppLogsPageComponent', () => {
  let component: AdminAppLogsPageComponent;
  let fixture: ComponentFixture<AdminAppLogsPageComponent>;
  let facade: AppLogsFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAppLogsPageComponent],
      providers: [AppLogsFacadeService]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAppLogsPageComponent);
    component = fixture.componentInstance;
    facade = fixture.debugElement.injector.get(AppLogsFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load app logs on init', () => {
    spyOn(facade, 'load');
    component.ngOnInit();
    expect(facade.load).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    spyOn(facade, 'applyFilters');
    component.onFiltersApplied({ level: 'error', origin: 'backend' });
    expect(facade.applyFilters).toHaveBeenCalled();
  });

  it('should clear filters', () => {
    spyOn(facade, 'clearFilters');
    component.onFiltersCleared();
    expect(facade.clearFilters).toHaveBeenCalled();
  });

  it('should run cleanup', () => {
    spyOn(facade, 'cleanupOldLogs');
    component.runCleanup();
    expect(facade.cleanupOldLogs).toHaveBeenCalled();
  });

  it('should handle row selection', () => {
    const rows = [{ id: 'log1', createdAt: '', level: '', origin: '', category: '', message: '', resolved: '' }];
    component.onSelectionChanged(rows);
    expect(component.selectedLogs()).toEqual(rows);
  });

  it('should render listing via zh-collection-view', () => {
    fixture.detectChanges();
    const collectionView = fixture.debugElement.query(By.css('zh-collection-view'));
    expect(collectionView).toBeTruthy();
  });
});
