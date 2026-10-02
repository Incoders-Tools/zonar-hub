import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableColumn, DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Record<string, unknown>>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DataTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(DataTableComponent);
    fixture.componentRef.setInput('columns', []);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('pill render type', () => {
    const pillColumns: DataTableColumn[] = [
      { key: 'name', labelKey: 'table.name' },
      { key: 'marker', labelKey: 'table.marker', renderType: 'pill' }
    ];

    function render(columns: DataTableColumn[], data: Record<string, unknown>[]): HTMLElement[] {
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      return Array.from(host.querySelectorAll<HTMLElement>('tbody tr'));
    }

    function pillIn(row: HTMLElement): HTMLElement | null {
      return row.querySelector<HTMLElement>('.data-table__pill');
    }

    it('renders no pill when the cell value is empty, null or undefined', () => {
      const rows = render(pillColumns, [
        { id: '1', name: 'Empty', marker: '' },
        { id: '2', name: 'Null', marker: null },
        { id: '3', name: 'Missing' },
        { id: '4', name: 'Blank', marker: '   ' }
      ]);

      expect(rows.length).toBe(4);
      rows.forEach(row => expect(pillIn(row)).toBeNull());
    });

    it('renders a pill only for the row that carries a value', () => {
      const rows = render(pillColumns, [
        { id: '1', name: 'Primary', marker: 'primary' },
        { id: '2', name: 'Other', marker: null }
      ]);

      const primaryPill = pillIn(rows[0]);
      expect(primaryPill).not.toBeNull();
      expect(primaryPill?.getAttribute('data-variant')).toBe('primary');
      expect(primaryPill?.textContent?.trim()).toBe('primary');
      expect(pillIn(rows[1])).toBeNull();
    });

    it('keeps rendering legitimate false and 0 values as pills', () => {
      const rows = render(pillColumns, [
        { id: '1', name: 'False', marker: false },
        { id: '2', name: 'Zero', marker: 0 }
      ]);

      expect(pillIn(rows[0])?.textContent?.trim()).toBe('false');
      expect(pillIn(rows[1])?.textContent?.trim()).toBe('0');
    });

    it('keeps the variant from pillVariantKey for active/type pills', () => {
      const rows = render(
        [{ key: 'statusLabel', labelKey: 'table.status', renderType: 'pill', pillVariantKey: 'status' }],
        [
          { id: '1', statusLabel: 'Active', status: 'active' },
          { id: '2', statusLabel: 'Inactive', status: 'inactive' }
        ]
      );

      expect(pillIn(rows[0])?.getAttribute('data-variant')).toBe('active');
      expect(pillIn(rows[0])?.textContent?.trim()).toBe('Active');
      expect(pillIn(rows[1])?.getAttribute('data-variant')).toBe('inactive');
    });
  });
});
