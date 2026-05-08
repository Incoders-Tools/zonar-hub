import {
  Component,
  ContentChild,
  TemplateRef,
  inject,
  input,
  output,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../data-table/data-table.component';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ErrorStateComponent } from '../error-state/error-state.component';

export type ZhCollectionViewMode = 'table' | 'cards';

export interface ZhCollectionRowAction {
  icon: string;
  labelKey: string;
  action: string;
  variant?: 'default' | 'primary' | 'warn' | 'danger';
}

const STORAGE_PREFIX = 'zh.collection-view.mode';

/**
 * Generic collection renderer that hosts both a table and a card grid for the
 * same dataset. Pages provide the table column definition plus a card
 * template (`<ng-template #cardTpl let-row>...</ng-template>`); the user toggle
 * choice is persisted in localStorage per `viewKey`.
 *
 * Default mode rule (per product spec):
 *  - If the listing is paginated → default to table.
 *  - If it is not paginated → default to cards.
 *  - The user's last choice for this page (saved by `viewKey`) overrides the
 *    default on subsequent visits.
 */
@Component({
  selector: 'zh-collection-view',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  templateUrl: './zh-collection-view.component.html',
  styleUrl: './zh-collection-view.component.scss'
})
export class ZhCollectionViewComponent<T extends Record<string, unknown>> {
  /** Stable key used to persist the chosen mode in localStorage. */
  readonly viewKey = input.required<string>();
  readonly items = input.required<T[]>();
  readonly columns = input<DataTableColumn[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  readonly emptyMessageKey = input('table.noData');
  readonly paginated = input(false);
  readonly pageSize = input(10);
  readonly selectable = input(false);
  readonly reorderable = input(false);
  readonly trackByKey = input('id');
  readonly rowActions = input<ZhCollectionRowAction[]>([]);

  readonly rowAction = output<{ action: string; row: T }>();
  readonly selectionChanged = output<T[]>();
  readonly sorted = output<{ key: string; direction: 'asc' | 'desc' }>();
  readonly retried = output<void>();

  /** Card layout template provided by the parent. */
  @ContentChild('cardTpl', { read: TemplateRef })
  readonly cardTemplate: TemplateRef<{ $implicit: T; row: T }> | null = null;

  protected readonly mode = signal<ZhCollectionViewMode>('table');

  readonly currentMode = this.mode.asReadonly();

  constructor() {
    // Initial mode = stored choice, fallback to (paginated ? table : cards).
    effect(() => {
      const key = this.viewKey();
      if (!key) return;
      const stored = this.readStoredMode(key);
      if (stored) {
        this.mode.set(stored);
      } else {
        this.mode.set(this.paginated() ? 'table' : 'cards');
      }
    }, { allowSignalWrites: true });
  }

  protected readonly hasItems = computed(() => this.items().length > 0);
  protected readonly showLoading = computed(() => this.loading() && !this.hasItems());
  protected readonly showError = computed(() => this.error() && !this.loading());

  setMode(mode: ZhCollectionViewMode): void {
    this.mode.set(mode);
    const key = this.viewKey();
    if (key) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}.${key}`, mode);
      } catch {
        // ignore (private mode / unsupported)
      }
    }
  }

  protected onRowAction(event: { action: string; row: T }): void {
    this.rowAction.emit(event);
  }

  protected onSelectionChanged(rows: T[]): void {
    this.selectionChanged.emit(rows);
  }

  protected onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.sorted.emit(event);
  }

  protected onRetried(): void {
    this.retried.emit();
  }

  protected onCardAction(action: string, row: T): void {
    this.rowAction.emit({ action, row });
  }

  private readStoredMode(key: string): ZhCollectionViewMode | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}.${key}`);
      if (raw === 'table' || raw === 'cards') return raw;
    } catch {
      // ignore
    }
    return null;
  }
}
