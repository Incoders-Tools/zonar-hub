import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TournamentModality } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ModalitiesFacadeService, ModalityFilters } from './modalities-facade.service';
import { ModalitiesFormPanelComponent } from './modalities-form-panel/modalities-form-panel.component';

interface ModalityRow extends Record<string, unknown> {
  id: string;
  nameEs: string;
  nameEn: string;
  namePt: string;
  key: string;
  sortOrder: number;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-tournament-modalities-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    ModalitiesFormPanelComponent
  ],
  providers: [ModalitiesFacadeService],
  templateUrl: './admin-tournament-modalities-page.component.html',
  styleUrl: './admin-tournament-modalities-page.component.scss',
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
export class AdminTournamentModalitiesPageComponent implements OnInit {
  readonly facade = inject(ModalitiesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingModality = signal<TournamentModality | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedModalities = signal<ModalityRow[]>([]);

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'nameEs', labelKey: 'admin.modalities.column.nameEs', sortable: true },
      { key: 'nameEn', labelKey: 'admin.modalities.column.nameEn', sortable: true },
      { key: 'namePt', labelKey: 'admin.modalities.column.namePt', sortable: true },
      { key: 'isActive', labelKey: 'admin.modalities.column.status', sortable: true, renderType: 'toggle', toggleAction: 'toggleActive' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'admin.modalities.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'admin.modalities.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

  readonly rowActions = computed(() => {
    if (this.isSystemAdmin()) {
      return [
        { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
        { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
      ];
    }
    return [
      { icon: 'visibility', labelKey: 'common.view', action: 'view', variant: 'primary' as const }
    ];
  });

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.modalities.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.modalities.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.modalities.status.active' },
        { value: 'false', labelKey: 'admin.modalities.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<ModalityRow[]>(() =>
    this.facade.filteredModalities().map(m => ({
      id: m.id,
      nameEs: m.nameEs,
      nameEn: m.nameEn,
      namePt: m.namePt,
      key: m.key,
      sortOrder: m.sortOrder,
      isActive: m.isActive,
      statusLabel: m.isActive ? 'admin.modalities.status.active' : 'admin.modalities.status.inactive',
      statusVariant: m.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedModalities().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.modalities.help.section1Title', contentKey: 'admin.modalities.help.section1Text' },
    { titleKey: 'admin.modalities.help.section2Title', contentKey: 'admin.modalities.help.section2Text' }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: ModalityFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: ModalityRow }): void {
    if (event.action === 'edit' || event.action === 'view') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    } else if (event.action === 'toggleActive') {
      this.toggleActive(event.row);
    }
  }

  openCreate(): void {
    this.editingModality.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: ModalityRow): void {
    const modality = this.facade.filteredModalities().find(m => m.id === row.id);
    if (modality) {
      this.editingModality.set(modality);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingModality.set(null);
  }

  async toggleActive(row: ModalityRow): Promise<void> {
    const modality = this.facade.filteredModalities().find(m => m.id === row.id);
    if (modality) {
      await this.facade.saveModality({ ...modality, isActive: !modality.isActive });
    }
  }

  confirmDelete(row: ModalityRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteModality(id);
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

  onSelectionChanged(rows: ModalityRow[]): void {
    this.selectedModalities.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedModalities().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedModalities.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
