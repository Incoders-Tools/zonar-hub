import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ZhCollectionRowAction, ZhCollectionViewComponent } from './zh-collection-view.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DataTableColumn } from '../data-table/data-table.component';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [ZhCollectionViewComponent],
  template: `
    <zh-collection-view
      viewKey="test-key"
      [items]="items"
      [columns]="columns"
      [paginated]="paginated"
      [rowActions]="rowActions"
      [rowActionsFilter]="filter"
      [pageSize]="pageSize"
      [serverSide]="serverSide"
      [page]="page"
      [totalCount]="totalCount"
      (pageChange)="pageChanges.push($event)"
      (rowAction)="emitted.push($event)">
    </zh-collection-view>
  `
})
class TestHostComponent {
  items: TestRow[] = [{ id: '1', name: 'Row 1' }];
  columns: DataTableColumn[] = [{ key: 'name', labelKey: 'Name' }];
  rowActions: ZhCollectionRowAction[] = [];
  filter: ((row: TestRow) => ZhCollectionRowAction[]) | null = null;
  emitted: { action: string; row: TestRow }[] = [];
  /** true → default mode is table (needed for tests that query DataTableComponent) */
  paginated = true;
  pageSize = 10;
  serverSide = false;
  page = 1;
  totalCount: number | null = null;
  pageChanges: number[] = [];
}

const STORAGE_KEY = 'zh.collection-view.mode.test-key';

const EDIT: ZhCollectionRowAction = { icon: 'edit', labelKey: 'common.edit', action: 'edit' };
const DELETE: ZhCollectionRowAction = { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' };

describe('ZhCollectionViewComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  function showCards(): void {
    const cardsToggle = fixture.debugElement.queryAll(By.css('.zh-collection-view__toggle-btn'))[1];
    cardsToggle.nativeElement.click();
    fixture.detectChanges();
  }

  function cardActionsOf(cardIndex: number): string[] {
    const card = fixture.debugElement.queryAll(By.css('.zh-collection-view__card'))[cardIndex];
    return card
      .queryAll(By.css('.zh-collection-view__card-action mat-icon'))
      .map(icon => (icon.nativeElement as HTMLElement).textContent?.trim() ?? '');
  }

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  it('should render collection view', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('zh-collection-view')).toBeTruthy();
  });

  it('forwards rowActionsFilter to inner data-table in table mode', () => {
    const filterFn = (row: TestRow) => row.id === '1'
      ? [{ icon: 'edit', labelKey: 'Edit', action: 'edit' }]
      : [];

    host.filter = filterFn;
    fixture.detectChanges();

    const tableDebug = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(tableDebug).toBeTruthy();
    const tableInstance = tableDebug.componentInstance as DataTableComponent<TestRow>;
    expect(tableInstance.rowActionsFilter()).toBe(filterFn);
  });

  it('forwards null rowActionsFilter to inner data-table', () => {
    host.filter = null;
    fixture.detectChanges();

    const tableDebug = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(tableDebug).toBeTruthy();
    const tableInstance = tableDebug.componentInstance as DataTableComponent<TestRow>;
    expect(tableInstance.rowActionsFilter()).toBeNull();
  });

  describe('card mode actions', () => {
    beforeEach(() => {
      host.items = [{ id: '1', name: 'Row 1' }, { id: '2', name: 'Row 2' }];
      host.rowActions = [EDIT, DELETE];
      fixture.detectChanges();
      showCards();
    });

    it('renders every rowAction on each card when no rowActionsFilter is provided', () => {
      expect(cardActionsOf(0)).toEqual(['edit', 'delete']);
      expect(cardActionsOf(1)).toEqual(['edit', 'delete']);
    });

    it('renders only the actions returned by rowActionsFilter for each card', () => {
      host.filter = row => row.id === '1' ? [EDIT] : [DELETE];
      fixture.detectChanges();

      expect(cardActionsOf(0)).toEqual(['edit']);
      expect(cardActionsOf(1)).toEqual(['delete']);
    });

    it('omits the card actions container when rowActionsFilter returns no actions for a row', () => {
      host.filter = row => row.id === '1' ? [EDIT] : [];
      fixture.detectChanges();

      const cards = fixture.debugElement.queryAll(By.css('.zh-collection-view__card'));
      expect(cards[0].query(By.css('.zh-collection-view__card-actions'))).toBeTruthy();
      expect(cards[1].query(By.css('.zh-collection-view__card-actions'))).toBeNull();
    });

    it('emits rowAction with the filtered action and its row', () => {
      host.filter = row => row.id === '2' ? [DELETE] : [];
      fixture.detectChanges();

      const card = fixture.debugElement.queryAll(By.css('.zh-collection-view__card'))[1];
      card.query(By.css('.zh-collection-view__card-action')).nativeElement.click();

      expect(host.emitted).toEqual([{ action: 'delete', row: host.items[1] }]);
    });
  });

  describe('pagination', () => {
    const makeRows = (count: number): TestRow[] =>
      Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Row ${i + 1}` }));

    function el(): HTMLElement {
      return fixture.nativeElement as HTMLElement;
    }
    function pagers(): HTMLElement[] {
      return Array.from(el().querySelectorAll<HTMLElement>('.data-table__pagination'));
    }
    function nextBtn(): HTMLButtonElement {
      return el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[1];
    }

    it('keeps the client card mode unpaginated by default', () => {
      host.items = makeRows(25);
      host.pageSize = 20;
      fixture.detectChanges();
      showCards();

      expect(el().querySelectorAll('.zh-collection-view__card').length).toBe(25);
      expect(pagers().length).toBe(0);
    });

    describe('server mode', () => {
      beforeEach(() => {
        host.items = makeRows(25);
        host.pageSize = 20;
        host.serverSide = true;
        host.page = 1;
        host.totalCount = 45;
        fixture.detectChanges();
      });

      it('renders a single pager in table mode with every supplied row', () => {
        expect(el().querySelectorAll('tbody tr').length).toBe(25);
        expect(pagers().length).toBe(1);
        expect(el().querySelector('.data-table__pagination-page')?.textContent).toContain('1 / 3');

        nextBtn().click();
        expect(host.pageChanges).toEqual([2]);
      });

      it('renders every supplied card plus the shared pager in card mode', () => {
        showCards();

        expect(el().querySelectorAll('.zh-collection-view__card').length).toBe(25);
        expect(pagers().length).toBe(1);
        expect(el().querySelector('.data-table__pagination-page')?.textContent).toContain('1 / 3');

        nextBtn().click();
        expect(host.pageChanges).toEqual([2]);
      });

      it('reflects the controlled page in card mode', () => {
        showCards();
        host.page = 3;
        host.items = makeRows(5);
        fixture.detectChanges();

        expect(el().querySelectorAll('.zh-collection-view__card').length).toBe(5);
        expect(el().querySelector('.data-table__pagination-page')?.textContent).toContain('3 / 3');
        expect(nextBtn().disabled).toBeTrue();
      });

      it('recovers from an out-of-range page in card mode', () => {
        showCards();
        host.pageSize = 10;
        host.page = 5;
        host.totalCount = 20;
        host.items = [];
        fixture.detectChanges();

        expect(el().querySelector('app-empty-state')).not.toBeNull();
        expect(pagers().length).toBe(1);
        expect(el().querySelector('.data-table__pagination-info')?.textContent).toContain('0–0');
        expect(nextBtn().disabled).toBeTrue();

        el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[0].click();
        expect(host.pageChanges).toEqual([2]);
      });

      it('shows the empty state without a pager when the total is 0', () => {
        showCards();
        host.items = [];
        host.totalCount = 0;
        fixture.detectChanges();

        expect(el().querySelector('app-empty-state')).not.toBeNull();
        expect(pagers().length).toBe(0);
      });
    });
  });
});
