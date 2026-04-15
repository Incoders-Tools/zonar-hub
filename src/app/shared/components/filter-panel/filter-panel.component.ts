import { Component, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface FilterField {
  key: string;
  labelKey: string;
  type: 'text' | 'select';
  options?: { value: string; labelKey: string }[];
}

export interface SortOption {
  key: string;
  labelKey: string;
}

export interface SortRule {
  field: string;
  dir: 'asc' | 'desc';
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule, TranslatePipe, CdkDropList, CdkDrag],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss'
})
export class FilterPanelComponent {
  readonly fields = input.required<FilterField[]>();
  readonly sortFields = input<SortOption[]>([]);
  readonly defaultSortRules = input<SortRule[]>([]);
  readonly collapsible = input(false);
  readonly defaultCollapsed = input(false);
  readonly filtersApplied = output<Record<string, string>>();
  readonly filtersCleared = output<void>();
  readonly sortRulesChanged = output<SortRule[]>();

  readonly collapsed = signal(false);
  readonly sortsOpen = signal(false);
  values: Record<string, string> = {};
  sortRules: SortRule[] = [];

  get hasActiveFilters(): boolean {
    return Object.values(this.values).some(v => v != null && v !== '');
  }

  ngOnInit(): void {
    if (this.defaultCollapsed()) {
      this.collapsed.set(true);
    }
    const defaults = this.defaultSortRules();
    if (defaults.length > 0) {
      this.sortRules = defaults.map(r => ({ ...r }));
    }
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
  }

  toggleSorts(): void {
    this.sortsOpen.update(v => !v);
  }

  apply(): void {
    this.filtersApplied.emit({ ...this.values });
  }

  clear(): void {
    this.values = {};
    this.sortRules = [];
    this.sortsOpen.set(false);
    this.filtersCleared.emit();
    this.sortRulesChanged.emit([]);
  }

  // ── Sort rule management ──

  availableFieldsForRule(currentField: string): SortOption[] {
    const usedFields = new Set(this.sortRules.map(r => r.field));
    return this.sortFields().filter(f => f.key === currentField || !usedFields.has(f.key));
  }

  addSortRule(): void {
    const available = this.sortFields().filter(
      f => !this.sortRules.some(r => r.field === f.key)
    );
    if (available.length === 0) return;
    this.sortRules = [...this.sortRules, { field: available[0].key, dir: 'asc' }];
    this.emitSortRules();
  }

  removeSortRule(index: number): void {
    this.sortRules = this.sortRules.filter((_, i) => i !== index);
    this.emitSortRules();
  }

  updateSortField(index: number, field: string): void {
    this.sortRules = this.sortRules.map((r, i) => i === index ? { ...r, field } : r);
    this.emitSortRules();
  }

  updateSortDir(index: number, dir: 'asc' | 'desc'): void {
    this.sortRules = this.sortRules.map((r, i) => i === index ? { ...r, dir } : r);
    this.emitSortRules();
  }

  canAddSortRule(): boolean {
    return this.sortRules.length < this.sortFields().length;
  }

  dropSortRule(event: CdkDragDrop<SortRule[]>): void {
    const rules = [...this.sortRules];
    moveItemInArray(rules, event.previousIndex, event.currentIndex);
    this.sortRules = rules;
    this.emitSortRules();
  }

  private emitSortRules(): void {
    this.sortRulesChanged.emit([...this.sortRules]);
  }
}
