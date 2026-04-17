import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CollapsibleSectionComponent } from '../collapsible-section/collapsible-section.component';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface ChildGridColumn {
  key: string;
  labelKey: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'display';
  required?: boolean;
  options?: { value: string; label: string }[];
  width?: string;
}

@Component({
  selector: 'app-child-collection-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatIcon,
    TranslatePipe,
    CollapsibleSectionComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  templateUrl: './child-collection-grid.component.html',
  styleUrl: './child-collection-grid.component.scss'
})
export class ChildCollectionGridComponent {
  // --- Column configuration ---
  readonly columns = input.required<ChildGridColumn[]>();

  // --- Mode ---
  readonly mode = input<'edit' | 'select'>('edit');

  // --- Edit mode (FormArray) ---
  readonly formArray = input<FormArray | null>(null);
  readonly rowFactory = input<(() => FormGroup) | null>(null);

  // --- Select mode ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly items = input<any[]>([]);
  readonly selectedIds = input<Set<string>>(new Set());
  readonly initialOrderedIds = input<string[]>([]);
  readonly trackByKey = input('id');

  // --- Common ---
  readonly titleKey = input('');
  readonly addLabelKey = input('childGrid.addRow');
  readonly removeLabelKey = input('childGrid.removeRow');
  readonly emptyMessageKey = input('childGrid.noItems');
  readonly selectAllLabelKey = input('childGrid.selectAll');
  readonly deselectAllLabelKey = input('childGrid.deselectAll');
  readonly collapsible = input(false);
  readonly initialExpanded = input(true);
  readonly reorderable = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly maxRows = input<number | null>(null);

  // --- Outputs ---
  readonly rowAdded = output<void>();
  readonly rowRemoved = output<number>();
  readonly rowReordered = output<{ previousIndex: number; currentIndex: number }>();
  readonly selectionChanged = output<Set<string>>();
  readonly selectionReordered = output<string[]>();

  // --- Internal state ---
  private readonly _selectedIds = signal<Set<string>>(new Set());
  private readonly _orderedSelectedIds = signal<string[]>([]);

  constructor() {
    effect(() => {
      const initial = this.initialOrderedIds();
      if (initial.length > 0) {
        this._orderedSelectedIds.set([...initial]);
      }
    });
  }

  readonly internalSelectedIds = computed(() => {
    const external = this.selectedIds();
    return external.size > 0 ? external : this._selectedIds();
  });

  /** Selected items ordered by the user's drag-drop sequence */
  readonly orderedSelectedItems = computed(() => {
    const ordered = this._orderedSelectedIds();
    const selected = this.internalSelectedIds();
    const allItems = this.items();
    const key = this.trackByKey();
    if (ordered.length === 0) {
      return allItems.filter((item: any) => selected.has(String(item[key] ?? '')));
    }
    const selectedItems = allItems.filter((item: any) => selected.has(String(item[key] ?? '')));
    return selectedItems.sort((a: any, b: any) => {
      const aIdx = ordered.indexOf(String(a[key] ?? ''));
      const bIdx = ordered.indexOf(String(b[key] ?? ''));
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  });

  readonly allSelected = computed(() => {
    const items = this.items();
    const selected = this.internalSelectedIds();
    if (items.length === 0) return false;
    return items.every((item: any) => selected.has(this.getItemId(item)));
  });

  /** Items not currently selected (for reorderable pick-list) */
  readonly unselectedItems = computed(() => {
    const selected = this.internalSelectedIds();
    return this.items().filter((item: any) => !selected.has(this.getItemId(item)));
  });

  readonly someSelected = computed(() => {
    const items = this.items();
    const selected = this.internalSelectedIds();
    if (items.length === 0) return false;
    const count = items.filter((item: any) => selected.has(this.getItemId(item))).length;
    return count > 0 && count < items.length;
  });

  readonly canAddRow = computed(() => {
    const max = this.maxRows();
    const fa = this.formArray();
    if (max === null || !fa) return true;
    return fa.length < max;
  });

  // --- Edit mode methods ---

  addRow(): void {
    const fa = this.formArray();
    const factory = this.rowFactory();
    if (!fa || !factory || this.disabled()) return;
    fa.push(factory());
    this.rowAdded.emit();
  }

  removeRow(index: number): void {
    const fa = this.formArray();
    if (!fa || this.disabled()) return;
    fa.removeAt(index);
    this.rowRemoved.emit(index);
  }

  onDrop(event: CdkDragDrop<unknown>): void {
    const fa = this.formArray();
    if (!fa || this.disabled()) return;
    const controls = [...fa.controls];
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    fa.clear();
    controls.forEach(c => fa.push(c));
    this.rowReordered.emit({ previousIndex: event.previousIndex, currentIndex: event.currentIndex });
  }

  getFormGroup(index: number): FormGroup {
    return this.formArray()!.at(index) as FormGroup;
  }

  isRowInvalid(index: number): boolean {
    const group = this.getFormGroup(index);
    return group.invalid && group.touched;
  }

  // --- Select mode methods ---

  getItemId(item: any): string {
    return String(item[this.trackByKey()] ?? '');
  }

  isItemSelected(item: any): boolean {
    return this.internalSelectedIds().has(this.getItemId(item));
  }

  toggleItem(item: any): void {
    if (this.disabled()) return;
    const id = this.getItemId(item);
    const next = new Set(this.internalSelectedIds());
    const ordered = [...this._orderedSelectedIds()];
    if (next.has(id)) {
      next.delete(id);
      const idx = ordered.indexOf(id);
      if (idx !== -1) ordered.splice(idx, 1);
    } else {
      next.add(id);
      ordered.push(id);
    }
    this._selectedIds.set(next);
    this._orderedSelectedIds.set(ordered);
    this.selectionChanged.emit(next);
    if (this.reorderable() && this.mode() === 'select') {
      this.selectionReordered.emit(ordered);
    }
  }

  selectAll(): void {
    if (this.disabled()) return;
    const allIds = this.items().map((item: any) => this.getItemId(item));
    const next = new Set(allIds);
    this._selectedIds.set(next);
    this._orderedSelectedIds.set(allIds);
    this.selectionChanged.emit(next);
    if (this.reorderable() && this.mode() === 'select') {
      this.selectionReordered.emit(allIds);
    }
  }

  deselectAll(): void {
    if (this.disabled()) return;
    const next = new Set<string>();
    this._selectedIds.set(next);
    this._orderedSelectedIds.set([]);
    this.selectionChanged.emit(next);
    if (this.reorderable() && this.mode() === 'select') {
      this.selectionReordered.emit([]);
    }
  }

  onSelectDrop(event: CdkDragDrop<unknown>): void {
    if (this.disabled()) return;
    const ordered = this.orderedSelectedItems().map((item: any) => this.getItemId(item));
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    this._orderedSelectedIds.set(ordered);
    this.selectionReordered.emit(ordered);
  }

  getCellValue(item: any, column: ChildGridColumn): unknown {
    return item[column.key];
  }
}
