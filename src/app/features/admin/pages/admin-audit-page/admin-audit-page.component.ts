import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { AuditLog } from '../../../../core/models/operational.model';
import { AuditFacadeService, AuditFilters } from './audit-facade.service';

interface AuditRow extends Record<string, unknown> {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: string;
}

@Component({
  selector: 'app-admin-audit-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent
  ],
  providers: [AuditFacadeService],
  templateUrl: './admin-audit-page.component.html',
  styleUrl: './admin-audit-page.component.scss'
})
export class AdminAuditPageComponent implements OnInit {
  readonly facade = inject(AuditFacadeService);

  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly selectedLogs = signal<AuditRow[]>([]);
  readonly deletingId = signal<string | null>(null);

  readonly columns: DataTableColumn[] = [
    { key: 'timestamp', labelKey: 'admin.audit.column.timestamp', sortable: true, renderType: 'date' },
    { key: 'userId', labelKey: 'admin.audit.column.user', sortable: true },
    { key: 'action', labelKey: 'admin.audit.column.action', sortable: true },
    { key: 'entityType', labelKey: 'admin.audit.column.entity', sortable: true },
    { key: 'entityId', labelKey: 'admin.audit.column.entityId', sortable: true },
    { key: 'changes', labelKey: 'admin.audit.column.changes', sortable: false }
  ];

  readonly rowActions = [
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'action', labelKey: 'admin.audit.filter.action', type: 'select',
      options: [
        { value: 'CREATE', labelKey: 'admin.audit.action.create' },
        { value: 'UPDATE', labelKey: 'admin.audit.action.update' },
        { value: 'DELETE', labelKey: 'admin.audit.action.delete' },
        { value: 'EXECUTE', labelKey: 'admin.audit.action.execute' },
        { value: 'RESTORE', labelKey: 'admin.audit.action.restore' }
      ]
    },
    { key: 'entityType', labelKey: 'admin.audit.filter.entityType', type: 'text' },
    { key: 'userId', labelKey: 'admin.audit.filter.user', type: 'text' }
  ];

  readonly tableData = computed<AuditRow[]>(() =>
    this.facade.filteredLogs().map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: this.formatChanges(log)
    }))
  );

  readonly hasSelection = computed(() => this.selectedLogs().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.audit.help.description' },
    { titleKey: 'admin.audit.help.actions', items: [
      'admin.audit.help.actionCreate',
      'admin.audit.help.actionUpdate',
      'admin.audit.help.actionDelete',
      'admin.audit.help.actionExecute',
      'admin.audit.help.actionRestore'
    ]}
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: AuditFilters = {
      action: filters['action'] || undefined,
      entityType: filters['entityType'] || undefined,
      userId: filters['userId'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: AuditRow[]): void {
    this.selectedLogs.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: AuditRow }): void {
    if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  confirmDelete(row: AuditRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  executeDelete(): void {
    const id = this.deletingId();
    if (id) {
      this.facade.delete(id);
      this.closeDeleteDialog();
    }
  }

  cancelDelete(): void {
    this.closeDeleteDialog();
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  openBulkDelete(): void {
    this.showBulkDeleteDialog.set(true);
  }

  executeBulkDelete(): void {
    const ids = this.selectedLogs().map(r => r.id);
    this.facade.bulkDelete(ids);
    this.closeBulkDeleteDialog();
  }

  cancelBulkDelete(): void {
    this.closeBulkDeleteDialog();
  }

  closeBulkDeleteDialog(): void {
    this.showBulkDeleteDialog.set(false);
    this.selectedLogs.set([]);
  }

  private formatChanges(log: AuditLog): string {
    if (log.action === 'CREATE') {
      return 'New record';
    }
    if (log.action === 'DELETE') {
      return 'Record deleted';
    }
    if (log.action === 'UPDATE') {
      return 'Updated';
    }
    return log.action;
  }
}

