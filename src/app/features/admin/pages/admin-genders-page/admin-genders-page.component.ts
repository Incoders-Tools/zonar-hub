import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { GenderFacadeService, GenderFilters } from './gender-facade.service';
import { GenderFormPanelComponent } from './gender-form-panel/gender-form-panel.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { Gender } from '../../../../core/models';

interface GenderRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  sortOrder: number;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-genders-page',
  standalone: true,
  imports: [
    TranslatePipe,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    GenderFormPanelComponent,
    HelpButtonComponent
  ],
  providers: [GenderFacadeService],
  templateUrl: './admin-genders-page.component.html',
  styleUrl: './admin-genders-page.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class AdminGendersPageComponent implements OnInit {
  readonly facade = inject(GenderFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingGender = signal<Gender | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedGenders = signal<GenderRow[]>([]);

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'genders.column.name', sortable: true },
      // The status column doubles as an inline activate/deactivate toggle so
      // admins (who can't access the form) can still flip the row.
      { key: 'isActive', labelKey: 'genders.column.status', sortable: true, renderType: 'toggle', toggleAction: 'toggleActive' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'genders.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'genders.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

  /**
   * Catalog policy: only sysadmin can mutate the catalog. Admins can still
   * toggle active/inactive via the row toggle column but never edit/delete.
   */
  readonly genderRowActions = computed(() => {
    if (!this.isSystemAdmin()) return [];
    return [
      { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
      { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
    ];
  });

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'genders.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'genders.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'genders.status.active' },
        { value: 'false', labelKey: 'genders.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<GenderRow[]>(() =>
    this.facade.filteredGenders().map(g => ({
      id: g.id,
      name: g.name,
      key: g.key,
      isActive: g.isActive,
      sortOrder: g.sortOrder,
      statusLabel: g.isActive ? 'genders.status.active' : 'genders.status.inactive',
      statusVariant: g.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedGenders().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'genders.help.whatTitle', contentKey: 'genders.help.whatDescription' },
    { titleKey: 'genders.help.impactTitle', contentKey: 'genders.help.impactDescription' },
    { titleKey: 'genders.help.keyTitle', contentKey: 'genders.help.keyDescription' }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: GenderFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: GenderRow }): void {
    if (event.action === 'edit' && this.isSystemAdmin()) {
      this.openEdit(event.row);
    } else if (event.action === 'delete' && this.isSystemAdmin()) {
      this.confirmDelete(event.row);
    } else if (event.action === 'toggleActive') {
      this.toggleGenderActive(event.row);
    }
  }

  openCreate(): void {
    this.editingGender.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: GenderRow): void {
    const gender = this.facade.filteredGenders().find(g => g.id === row.id);
    if (gender) {
      this.editingGender.set(gender);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingGender.set(null);
  }

  /**
   * Activate / deactivate a gender. Available to both admin and sysadmin —
   * they can toggle the row even though only sysadmin can mutate the rest of
   * the catalog through the form.
   */
  async toggleGenderActive(row: GenderRow): Promise<void> {
    const gender = this.facade.filteredGenders().find(g => g.id === row.id);
    if (!gender) return;
    await this.facade.save(
      { ...gender, isActive: !gender.isActive },
      gender.id
    );
  }

  confirmDelete(row: GenderRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteGender(id);
      if (success) {
        this.showDeleteDialog.set(false);
        this.deletingId.set(null);
      }
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  onSelectionChanged(rows: GenderRow[]): void {
    this.selectedGenders.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedGenders().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedGenders.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  getStatusForRow(row: GenderRow): string {
    return row.isActive ? 'active' : 'inactive';
  }
}
