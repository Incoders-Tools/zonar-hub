import { Component, input, output, computed } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Shared pager used by `app-data-table` and by `zh-collection-view` card mode so
 * both views expose the same markup, labels and styles. It is fully controlled:
 * it only renders `page`/`totalCount` and emits `pageChange`.
 */
@Component({
  selector: 'app-data-table-paginator',
  standalone: true,
  imports: [TranslatePipe],
  host: { class: 'data-table__paginator' },
  templateUrl: './data-table-paginator.component.html',
  styleUrl: './data-table-paginator.component.scss'
})
export class DataTablePaginatorComponent {
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly totalCount = input(0);
  /** Rows rendered on the current page; defaults to a full page. */
  readonly visibleCount = input<number | null>(null);

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  /** The page lies beyond the data (e.g. server total shrank); nothing on it is real. */
  readonly outOfRange = computed(() => this.page() > this.totalPages());
  private readonly visible = computed(() => this.visibleCount() ?? this.pageSize());
  /** 0 when no row is shown, so the range reads `0–0` instead of inventing a row. */
  readonly rangeStart = computed(() => {
    if (this.totalCount() === 0 || this.outOfRange() || this.visible() === 0) return 0;
    return Math.min((this.page() - 1) * this.pageSize() + 1, this.totalCount());
  });
  readonly rangeEnd = computed(() => {
    const start = this.rangeStart();
    return start === 0 ? 0 : Math.min(start + this.visible() - 1, this.totalCount());
  });

  /** From an out-of-range page, Prev jumps to the last valid page instead of page - 1. */
  previous(): void {
    this.go(Math.min(this.page() - 1, this.totalPages()));
  }

  go(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
