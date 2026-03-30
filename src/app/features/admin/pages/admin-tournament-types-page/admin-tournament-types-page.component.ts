import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { TournamentType } from '../../../../core/models';
import { TournamentTypesFacadeService, TournamentTypeFilters } from './tournament-types-facade.service';
import { TournamentTypesFormDialogComponent } from './tournament-types-form-dialog/tournament-types-form-dialog.component';
import { TournamentTypesHelpDialogComponent } from './tournament-types-help-dialog/tournament-types-help-dialog.component';

interface TournamentTypeRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  sortOrder: number | null;
  isActive: boolean;
  scoresPoints: boolean;
  appliesGender: boolean;
  statusLabel: string;
  scoresPointsLabel: string;
  appliesGenderLabel: string;
}

@Component({
  selector: 'app-admin-tournament-types-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TournamentTypesFormDialogComponent,
    TournamentTypesHelpDialogComponent
  ],
  providers: [TournamentTypesFacadeService],
  templateUrl: './admin-tournament-types-page.component.html',
  styleUrl: './admin-tournament-types-page.component.scss',
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
export class AdminTournamentTypesPageComponent implements OnInit {
  readonly facade = inject(TournamentTypesFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly showHelpDialog = signal(false);
  readonly editingType = signal<TournamentType | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedTypes = signal<TournamentTypeRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tournament-types.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.tournament-types.column.key', sortable: true },
    { key: 'sortOrder', labelKey: 'admin.tournament-types.column.sortOrder', sortable: true },
    { key: 'scoresPointsLabel', labelKey: 'admin.tournament-types.column.scoresPoints', sortable: false },
    { key: 'appliesGenderLabel', labelKey: 'admin.tournament-types.column.appliesGender', sortable: false },
    { key: 'statusLabel', labelKey: 'admin.tournament-types.column.status', sortable: true }
  ];

  readonly typeRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tournament-types.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-types.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-types.status.active' },
        { value: 'false', labelKey: 'admin.tournament-types.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentTypeRow[]>(() =>
    this.facade.filteredTypes().map(t => ({
      id: t.id,
      name: t.name,
      key: t.key,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      scoresPoints: t.scoresPoints,
      appliesGender: t.appliesGender,
      statusLabel: t.isActive ? 'admin.tournament-types.status.active' : 'admin.tournament-types.status.inactive',
      scoresPointsLabel: t.scoresPoints ? 'common.yes' : 'common.no',
      appliesGenderLabel: t.appliesGender ? 'common.yes' : 'common.no'
    }))
  );

  readonly hasSelection = computed(() => this.selectedTypes().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentTypeFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentTypeRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingType.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: TournamentTypeRow): void {
    const type = this.facade.filteredTypes().find(t => t.id === row.id);
    if (type) {
      this.editingType.set(type);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingType.set(null);
  }

  confirmDelete(row: TournamentTypeRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteType(id);
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

  onSelectionChanged(rows: TournamentTypeRow[]): void {
    this.selectedTypes.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedTypes().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedTypes.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  openHelp(): void {
    this.showHelpDialog.set(true);
  }

  closeHelp(): void {
    this.showHelpDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
