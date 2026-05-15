import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { AppLogsFacadeService, AppLogFilters } from './app-logs-facade.service';

interface AppLogRow extends Record<string, unknown> {
  id: string;
  createdAt: string;
  level: string;
  origin: string;
  category: string;
  message: string;
  route?: string;
  resolved: string;
}

@Component({
  selector: 'app-admin-app-logs-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent
  ],
  providers: [AppLogsFacadeService],
  templateUrl: './admin-app-logs-page.component.html',
  styleUrl: './admin-app-logs-page.component.scss'
})
export class AdminAppLogsPageComponent implements OnInit {
  readonly facade = inject(AppLogsFacadeService);

  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly selectedLogs = signal<AppLogRow[]>([]);
  readonly deletingId = signal<string | null>(null);
  readonly retentionDays = signal(30);

  readonly columns: DataTableColumn[] = [
    { key: 'createdAt', labelKey: 'admin.appLogs.column.timestamp', sortable: true, renderType: 'date' },
    { key: 'level', labelKey: 'admin.appLogs.column.level', sortable: true },
    { key: 'origin', labelKey: 'admin.appLogs.column.origin', sortable: true },
    { key: 'category', labelKey: 'admin.appLogs.column.category', sortable: true },
    { key: 'message', labelKey: 'admin.appLogs.column.message', sortable: false },
    { key: 'route', labelKey: 'admin.appLogs.column.route', sortable: false },
    { key: 'resolved', labelKey: 'admin.appLogs.column.resolved', sortable: true }
  ];

  readonly rowActions = [
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'level', labelKey: 'admin.appLogs.filter.level', type: 'select',
      options: [
        { value: 'debug', labelKey: 'admin.appLogs.level.debug' },
        { value: 'info', labelKey: 'admin.appLogs.level.info' },
        { value: 'warn', labelKey: 'admin.appLogs.level.warn' },
        { value: 'error', labelKey: 'admin.appLogs.level.error' },
        { value: 'fatal', labelKey: 'admin.appLogs.level.fatal' }
      ]
    },
    { key: 'origin', labelKey: 'admin.appLogs.filter.origin', type: 'select',
      options: [
        { value: 'frontend', labelKey: 'admin.appLogs.origin.frontend' },
        { value: 'backend', labelKey: 'admin.appLogs.origin.backend' },
        { value: 'edge', labelKey: 'admin.appLogs.origin.edge' },
        { value: 'system', labelKey: 'admin.appLogs.origin.system' }
      ]
    },
    { key: 'resolved', labelKey: 'admin.appLogs.filter.resolved', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.appLogs.resolved.resolved' },
        { value: 'false', labelKey: 'admin.appLogs.resolved.pending' }
      ]
    },
    { key: 'search', labelKey: 'admin.appLogs.filter.search', type: 'text' }
  ];

  readonly tableData = computed<AppLogRow[]>(() =>
    this.facade.filteredLogs().map(log => ({
      id: log.id,
      createdAt: log.createdAt,
      level: log.level,
      origin: log.origin,
      category: log.category,
      message: log.message,
      route: log.route,
      resolved: log.resolved ? 'Resolved' : 'Pending'
    }))
  );

  readonly hasSelection = computed(() => this.selectedLogs().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.appLogs.help.description' },
    { titleKey: 'admin.appLogs.help.levels', items: [
      'admin.appLogs.help.levelDebug',
      'admin.appLogs.help.levelInfo',
      'admin.appLogs.help.levelWarn',
      'admin.appLogs.help.levelError',
      'admin.appLogs.help.levelFatal'
    ]},
    { titleKey: 'admin.appLogs.help.origins', items: [
      'admin.appLogs.help.originFrontend',
      'admin.appLogs.help.originBackend',
      'admin.appLogs.help.originEdge',
      'admin.appLogs.help.originSystem'
    ]}
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: AppLogFilters = {
      level: filters['level'] || undefined,
      origin: filters['origin'] || undefined,
      resolved: filters['resolved'] || undefined,
      search: filters['search'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: AppLogRow[]): void {
    this.selectedLogs.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: AppLogRow }): void {
    if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  confirmDelete(row: AppLogRow): void {
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

  runCleanup(): void {
    const days = Math.max(1, Math.min(3650, this.retentionDays()));
    this.facade.cleanupOldLogs(days);
  }

}

