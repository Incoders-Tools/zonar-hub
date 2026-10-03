import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
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

  describe('row actions', () => {
    it('exposes the translated action label as the accessible name of icon-only buttons', () => {
      const expectedLabel = TestBed.inject(I18nService).translate('common.edit');
      expect(expectedLabel).not.toBe('common.edit');

      fixture.componentRef.setInput('columns', [{ key: 'name', labelKey: 'table.name' }]);
      fixture.componentRef.setInput('data', [{ id: '1', name: 'Row' }]);
      fixture.componentRef.setInput('rowActions', [{ icon: 'edit', labelKey: 'common.edit', action: 'edit' }]);
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.data-table__action-btn');
      expect(button).not.toBeNull();
      expect(button?.getAttribute('aria-label')).toBe(expectedLabel);
      expect(button?.getAttribute('title')).toBe(expectedLabel);
      expect(button?.textContent?.trim()).toBe('edit');
    });
  });

  describe('pagination', () => {
    const columns: DataTableColumn[] = [{ key: 'name', labelKey: 'table.name' }];
    const makeRows = (count: number, offset = 0) =>
      Array.from({ length: count }, (_, i) => ({ id: String(offset + i + 1), name: `Row ${offset + i + 1}` }));

    function el(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }
    function bodyRows(): HTMLElement[] {
      return Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));
    }
    function pagers(): HTMLElement[] {
      return Array.from(el().querySelectorAll<HTMLElement>('.data-table__pagination'));
    }
    function prevBtn(): HTMLButtonElement {
      return el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[0];
    }
    function nextBtn(): HTMLButtonElement {
      return el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[1];
    }
    function text(selector: string): string {
      return (el().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    describe('client mode (default)', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('columns', columns);
        fixture.componentRef.setInput('data', makeRows(25));
        fixture.componentRef.setInput('paginated', true);
        fixture.componentRef.setInput('pageSize', 20);
        fixture.detectChanges();
      });

      it('slices data locally and navigates with the internal currentPage', () => {
        const emitted: number[] = [];
        fixture.componentInstance.pageChange.subscribe(p => emitted.push(p));

        expect(bodyRows().length).toBe(20);
        expect(text('.data-table__pagination-page')).toContain('1 / 2');
        expect(prevBtn().disabled).toBeTrue();

        nextBtn().click();
        fixture.detectChanges();

        expect(fixture.componentInstance.currentPage()).toBe(2);
        expect(bodyRows().length).toBe(5);
        expect(bodyRows()[0].textContent).toContain('Row 21');
        expect(text('.data-table__pagination-info')).toContain('21–25');
        expect(nextBtn().disabled).toBeTrue();
        expect(emitted).toEqual([]);
      });
    });

    describe('server mode', () => {
      let emitted: number[];

      beforeEach(() => {
        emitted = [];
        fixture.componentInstance.pageChange.subscribe(p => emitted.push(p));
        fixture.componentRef.setInput('columns', columns);
        fixture.componentRef.setInput('data', makeRows(25));
        fixture.componentRef.setInput('serverSide', true);
        fixture.componentRef.setInput('pageSize', 20);
        fixture.componentRef.setInput('page', 1);
        fixture.componentRef.setInput('totalCount', 45);
        fixture.detectChanges();
      });

      it('renders every supplied item without slicing them again', () => {
        expect(bodyRows().length).toBe(25);
        expect(pagers().length).toBe(1);
        expect(text('.data-table__pagination-info')).toContain('1–25');
        expect(text('.data-table__pagination-info')).toContain('45');
        expect(text('.data-table__pagination-page')).toContain('1 / 3');
      });

      it('emits pageChange instead of changing the page internally', () => {
        expect(prevBtn().disabled).toBeTrue();

        nextBtn().click();
        fixture.detectChanges();

        expect(emitted).toEqual([2]);
        expect(text('.data-table__pagination-page')).toContain('1 / 3');
        expect(bodyRows()[0].textContent).toContain('Row 1');
      });

      it('reflects the controlled page and disables next on the last page', () => {
        fixture.componentRef.setInput('page', 3);
        fixture.componentRef.setInput('data', makeRows(5, 40));
        fixture.detectChanges();

        expect(bodyRows().length).toBe(5);
        expect(text('.data-table__pagination-info')).toContain('41–45');
        expect(text('.data-table__pagination-page')).toContain('3 / 3');
        expect(nextBtn().disabled).toBeTrue();
        expect(prevBtn().disabled).toBeFalse();

        prevBtn().click();
        expect(emitted).toEqual([2]);
      });

      it('exposes a localized accessible name on the pager', () => {
        const i18n = TestBed.inject(I18nService);
        const label = i18n.translate('admin.pagination.label');
        expect(label).not.toBe('admin.pagination.label');
        expect(pagers()[0].tagName.toLowerCase()).toBe('nav');
        expect(pagers()[0].getAttribute('aria-label')).toBe(label);
        expect(text('.data-table__pagination-page')).toContain(i18n.translate('admin.pagination.page'));
      });

      it('clears the selection when the controlled page changes and emits only visible rows', () => {
        const selections: string[][] = [];
        fixture.componentInstance.selectionChanged.subscribe(rows => selections.push(rows.map(r => String(r['id']))));
        fixture.componentRef.setInput('selectable', true);
        fixture.detectChanges();

        el().querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!.click();
        fixture.detectChanges();
        expect(selections.at(-1)).toEqual(['1']);

        fixture.componentRef.setInput('page', 2);
        fixture.componentRef.setInput('data', makeRows(20, 20));
        fixture.detectChanges();

        expect(fixture.componentInstance.selectedIds().size).toBe(0);
        expect(selections.at(-1)).toEqual([]);
        expect(el().querySelectorAll('tbody input[type="checkbox"]:checked').length).toBe(0);
      });

      it('recovers from an out-of-range page by requesting the last valid page', () => {
        fixture.componentRef.setInput('pageSize', 10);
        fixture.componentRef.setInput('page', 5);
        fixture.componentRef.setInput('totalCount', 20);
        fixture.componentRef.setInput('data', []);
        fixture.detectChanges();

        expect(el().querySelector('app-empty-state')).not.toBeNull();
        expect(pagers().length).toBe(1);
        expect(text('.data-table__pagination-info')).toContain('0–0');
        expect(nextBtn().disabled).toBeTrue();

        prevBtn().click();
        expect(emitted).toEqual([2]);
      });

      it('shows the empty state and no pager when the total is 0', () => {
        fixture.componentRef.setInput('data', []);
        fixture.componentRef.setInput('totalCount', 0);
        fixture.detectChanges();

        expect(el().querySelector('app-empty-state')).not.toBeNull();
        expect(pagers().length).toBe(0);
        expect(bodyRows().length).toBe(0);
      });
    });
  });
});
