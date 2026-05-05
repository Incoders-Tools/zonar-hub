import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChildCollectionGridComponent, ChildGridColumn } from './child-collection-grid.component';

describe('ChildCollectionGridComponent', () => {
  let component: ChildCollectionGridComponent;
  let fixture: ComponentFixture<ChildCollectionGridComponent>;
  const fb = new FormBuilder();

  const selectColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'test.name', type: 'display' },
    { key: 'active', labelKey: 'test.active', type: 'checkbox' }
  ];

  const editColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'test.name', type: 'text', required: true },
    { key: 'quantity', labelKey: 'test.qty', type: 'number' }
  ];

  const mockItems = [
    { id: '1', name: 'Item A', active: true },
    { id: '2', name: 'Item B', active: false },
    { id: '3', name: 'Item C', active: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildCollectionGridComponent, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChildCollectionGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('columns', selectColumns);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Select mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('columns', selectColumns);
      fixture.componentRef.setInput('mode', 'select');
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
    });

    it('should render items as rows', () => {
      const rows = fixture.nativeElement.querySelectorAll('.child-grid__row');
      expect(rows.length).toBe(3);
    });

    it('should toggle item selection', () => {
      let emitted: Set<string> | null = null;
      component.selectionChanged.subscribe(v => emitted = v);
      component.toggleItem(mockItems[0]);
      expect(emitted).toBeTruthy();
      expect(emitted!.has('1')).toBeTrue();
    });

    it('should select all items', () => {
      let emitted: Set<string> | null = null;
      component.selectionChanged.subscribe(v => emitted = v);
      component.selectAll();
      expect(emitted!.size).toBe(3);
    });

    it('should deselect all items', () => {
      component.selectAll();
      let emitted: Set<string> | null = null;
      component.selectionChanged.subscribe(v => emitted = v);
      component.deselectAll();
      expect(emitted!.size).toBe(0);
    });
  });

  describe('Edit mode', () => {
    let formArray: FormArray;

    function createRow() {
      return fb.group({
        name: ['', Validators.required],
        quantity: [0]
      });
    }

    beforeEach(() => {
      formArray = fb.array([createRow(), createRow()]);
      fixture.componentRef.setInput('columns', editColumns);
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('formArray', formArray);
      fixture.componentRef.setInput('rowFactory', createRow);
      fixture.detectChanges();
    });

    it('should render rows for each FormGroup', () => {
      const rows = fixture.nativeElement.querySelectorAll('.child-grid__row');
      expect(rows.length).toBe(2);
    });

    it('should add a row', () => {
      component.addRow();
      expect(formArray.length).toBe(3);
    });

    it('should remove a row', () => {
      component.removeRow(0);
      expect(formArray.length).toBe(1);
    });

    it('should emit rowAdded on add', () => {
      let emitted = false;
      component.rowAdded.subscribe(() => emitted = true);
      component.addRow();
      expect(emitted).toBeTrue();
    });

    it('should emit rowRemoved on remove', () => {
      const emitSpy = spyOn(component.rowRemoved, 'emit').and.callThrough();
      component.removeRow(1);
      expect(emitSpy).toHaveBeenCalledWith(1);
    });

    it('should respect maxRows', () => {
      fixture.componentRef.setInput('maxRows', 2);
      fixture.detectChanges();
      expect(component.canAddRow()).toBeFalse();
    });

    it('should not add or remove when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      component.addRow();
      expect(formArray.length).toBe(2);
      component.removeRow(0);
      expect(formArray.length).toBe(2);
    });
  });
});
