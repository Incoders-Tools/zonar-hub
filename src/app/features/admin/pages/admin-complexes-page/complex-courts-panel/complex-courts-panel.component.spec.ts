import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexCourtsPanelComponent } from './complex-courts-panel.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Court } from '../../../../../core/models';

describe('ComplexCourtsPanelComponent', () => {
  let component: ComplexCourtsPanelComponent;
  let fixture: ComponentFixture<ComplexCourtsPanelComponent>;

  const mockCourts: Court[] = [
    { id: 'ct1', complexId: 'cx1', name: 'Cancha 1', sportIds: ['sp1'], surfaceType: 'sintético', isIndoor: false, isActive: true },
    { id: 'ct2', complexId: 'cx1', name: 'Cancha 2', sportIds: ['sp1', 'sp2'], surfaceType: 'cemento', isIndoor: true, isActive: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexCourtsPanelComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexCourtsPanelComponent);
    component = fixture.componentInstance;

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complexId', 'cx1');
      fixture.componentRef.setInput('courts', mockCourts);
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display courts as table rows', () => {
    fixture.detectChanges();
    expect(component.tableData.length).toBe(2);
    expect(component.tableData[0].name).toBe('Cancha 1');
  });

  it('should open create form', () => {
    component.openCreate();
    expect(component.showForm()).toBe(true);
    expect(component.editingCourt()).toBeNull();
  });

  it('should close form', () => {
    component.openCreate();
    component.closeForm();
    expect(component.showForm()).toBe(false);
  });

  it('should emit courtDeleted on delete', () => {
    spyOn(component.courtDeleted, 'emit');
    component.deletingId.set('ct1');
    component.executeDelete();
    expect(component.courtDeleted.emit).toHaveBeenCalledWith('ct1');
  });

  it('shows only availability and rejects mutations in availability-only mode', () => {
    fixture.componentRef.setInput('availabilityOnly', true);
    fixture.detectChanges();
    const saved = spyOn(component.courtSaved, 'emit');
    const deleted = spyOn(component.courtDeleted, 'emit');
    expect(fixture.nativeElement.querySelector('.courts-panel__actions app-async-button')).toBeNull();
    expect(component.rowActions.map(action => action.action)).toEqual(['availability']);
    component.openCreate();
    component.openEdit(component.tableData[0]);
    component.onRowAction({ action: 'delete', row: component.tableData[0] });
    component.deletingId.set('ct1');
    component.executeDelete();
    expect(component.showForm()).toBeFalse();
    expect(component.showDeleteDialog()).toBeFalse();
    expect(saved).not.toHaveBeenCalled();
    expect(deleted).not.toHaveBeenCalled();
  });

  it('still requests availability for persisted courts in availability-only mode', () => {
    fixture.componentRef.setInput('availabilityOnly', true);
    fixture.detectChanges();
    const requested = spyOn(component.availabilityRequested, 'emit');
    component.onRowAction({ action: 'availability', row: component.tableData[0] });
    expect(requested).toHaveBeenCalledOnceWith('ct1');
  });

  it('should emit availabilityRequested', () => {
    spyOn(component.availabilityRequested, 'emit');
    component.onRowAction({ action: 'availability', row: { id: 'ct1', name: 'Cancha 1', surfaceType: 'sintético', surfaceTypeLabel: 'admin.complexes.courts.surfaceType.synthetic', isIndoor: false, isActive: true, indoorLabel: '', statusLabel: '', statusVariant: 'active' } });
    expect(component.availabilityRequested.emit).toHaveBeenCalledWith('ct1');
  });
});
