import { Component, input, output, signal, computed, effect, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FormatDatePipe } from '../../pipes/format-date.pipe';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ErrorStateComponent } from '../error-state/error-state.component';
import { DataTablePaginatorComponent } from '../data-table-paginator/data-table-paginator.component';

export interface DataTableColumn {
  key: string;
  labelKey: string;
  sortable?: boolean;
  order?: number;
  renderType?: 'text' | 'pill' | 'date' | 'toggle' | 'icon';
  translate?: boolean;
  pillVariantKey?: string;
  /** For toggle columns: action name emitted when toggled */
  toggleAction?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, MatIcon, MatSlideToggle, TranslatePipe, FormatDatePipe, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent, DataTablePaginatorComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<DataTableColumn[]>();
  readonly data = input.required<T[]>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly emptyMessageKey = input('table.noData');
  readonly selectable = input(false);
  readonly paginated = input(false);
  readonly paginationPosition = input<'top' | 'bottom' | 'both'>('bottom');
  readonly pageSize = input(10);
  readonly trackByKey = input('id');
  readonly reorderable = input(false);
  readonly rowActions = input<{ icon: string; labelKey: string; action: string; variant?: 'default' | 'primary' | 'warn' | 'danger' }[]>([]);
  readonly rowActionsFilter = input<((row: T) => { icon: string; labelKey: string; action: string; variant?: 'default' | 'primary' | 'warn' | 'danger' }[]) | null>(null);
  readonly activeRowId = input<string | null>(null);
  /** Controlled server pagination: `data` is the current page and is rendered as-is. */
  readonly serverSide = input(false);
  /** Current page (1-based) when `serverSide` is true. */
  readonly page = input(1);
  /** Total items across all pages when `serverSide` is true; falls back to `data().length`. */
  readonly totalCount = input<number | null>(null);

  readonly rowSelected = output<T>();
  readonly selectionChanged = output<T[]>();
  readonly sorted = output<{ key: string; direction: 'asc' | 'desc' }>();
  readonly rowAction = output<{ action: string; row: T }>();
  readonly retried = output<void>();
  /** Emits the requested page in `serverSide` mode; the parent must update `page` and `data`. */
  readonly pageChange = output<number>();

  readonly selectedIds = signal<Set<string>>(new Set());
  readonly currentPage = signal(1);
  readonly sortKey = signal('');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  private readonly columnOrder = signal<string[]>([]);
  private dragSourceKey = '';

  readonly orderedColumns = computed(() => {
    const cols = this.columns();
    const order = this.columnOrder();
    if (order.length === 0) return cols;
    return [...cols].sort((a, b) => {
      const ai = order.indexOf(a.key);
      const bi = order.indexOf(b.key);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  });

  readonly showPagination = computed(() => this.paginated() || this.serverSide());
  readonly activePage = computed(() => this.serverSide() ? this.page() : this.currentPage());
  readonly totalItems = computed(() => this.serverSide() ? (this.totalCount() ?? this.data().length) : this.data().length);

  readonly totalPages = computed(() => {
    if (!this.showPagination()) return 1;
    return Math.max(1, Math.ceil(this.totalItems() / this.pageSize()));
  });

  readonly paginatedData = computed(() => {
    const all = this.data();
    if (this.serverSide() || !this.paginated()) return all;
    const start = (this.currentPage() - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  readonly allSelected = computed(() => {
    const page = this.paginatedData();
    if (page.length === 0) return false;
    return page.every(row => this.selectedIds().has(this.getRowId(row)));
  });

  constructor() {
    // Server pages are disjoint datasets: drop the selection whenever the controlled page or its
    // data changes (a filter or scope change replaces the dataset while staying on the same page).
    let previousPage: number | null = null;
    let previousData: T[] | null = null;
    effect(() => {
      const page = this.page();
      const data = this.data();
      if (!this.serverSide()) return;
      if (previousData !== null && (previousPage !== page || previousData !== data)) {
        untracked(() => {
          if (this.selectedIds().size > 0) this.clearSelection();
        });
      }
      previousPage = page;
      previousData = data;
    });
  }

  getRowId(row: T): string {
    return String(row[this.trackByKey()] ?? '');
  }

  isSelected(row: T): boolean {
    return this.selectedIds().has(this.getRowId(row));
  }

  isActiveRow(row: T): boolean {
    const activeId = this.activeRowId();
    return activeId != null && this.getRowId(row) === activeId;
  }

  toggleRow(row: T): void {
    const id = this.getRowId(row);
    this.selectedIds.update(s => {
      const next = new Set(s);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    this.emitSelection();
    this.rowSelected.emit(row);
  }

  toggleAll(): void {
    const page = this.paginatedData();
    const allSel = this.allSelected();
    this.selectedIds.update(s => {
      const next = new Set(s);
      page.forEach(row => {
        const id = this.getRowId(row);
        if (allSel) { next.delete(id); } else { next.add(id); }
      });
      return next;
    });
    this.emitSelection();
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.emitSelection();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      if (this.serverSide()) {
        this.pageChange.emit(page);
      } else {
        this.currentPage.set(page);
      }
    }
  }

  sortBy(column: DataTableColumn): void {
    if (!column.sortable) return;
    if (this.sortKey() === column.key) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }
    this.sorted.emit({ key: this.sortKey(), direction: this.sortDirection() });
  }

  onDragStart(key: string): void {
    this.dragSourceKey = key;
  }

  onDrop(targetKey: string): void {
    if (!this.dragSourceKey || this.dragSourceKey === targetKey) return;
    const cols = this.orderedColumns().map(c => c.key);
    const srcIdx = cols.indexOf(this.dragSourceKey);
    const tgtIdx = cols.indexOf(targetKey);
    if (srcIdx === -1 || tgtIdx === -1) return;
    cols.splice(srcIdx, 1);
    cols.splice(tgtIdx, 0, this.dragSourceKey);
    this.columnOrder.set(cols);
    this.dragSourceKey = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /** Pills render for any value except null, undefined or blank strings; false and 0 stay visible. */
  hasPillValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    return typeof value !== 'string' || value.trim() !== '';
  }

  onRowAction(action: string, row: T): void {
    this.rowAction.emit({ action, row });
  }

  getActionsForRow(row: T): { icon: string; labelKey: string; action: string; variant?: 'default' | 'primary' | 'warn' | 'danger' }[] {
    const filter = this.rowActionsFilter();
    return filter ? filter(row) : this.rowActions();
  }

  private emitSelection(): void {
    const ids = this.selectedIds();
    const selected = this.data().filter(row => ids.has(this.getRowId(row)));
    this.selectionChanged.emit(selected);
  }
}
