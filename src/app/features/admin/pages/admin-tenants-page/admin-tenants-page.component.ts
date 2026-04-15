import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { Tenant } from '../../../../core/models';
import { TenantFacadeService, TenantFilters } from './tenant-facade.service';
import { TenantFormPanelComponent } from './tenant-form-panel/tenant-form-panel.component';

interface TenantRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  contactEmail: string;
  planType: string;
  planTypeLabel: string;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-tenants-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TenantFormPanelComponent
  ],
  providers: [TenantFacadeService],
  templateUrl: './admin-tenants-page.component.html',
  styleUrl: './admin-tenants-page.component.scss'
})
export class AdminTenantsPageComponent implements OnInit {
  readonly facade = inject(TenantFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingTenant = signal<Tenant | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedTenants = signal<TenantRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tenants.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.tenants.column.key', sortable: true },
    { key: 'contactEmail', labelKey: 'admin.tenants.column.contactEmail', sortable: true },
    { key: 'planTypeLabel', labelKey: 'admin.tenants.column.plan', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'planVariant' },
    { key: 'statusLabel', labelKey: 'admin.tenants.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tenants.filter.name', type: 'text' },
    {
      key: 'planType', labelKey: 'admin.tenants.filter.plan', type: 'select',
      options: [
        { value: 'starter', labelKey: 'admin.tenants.plan.starter' },
        { value: 'pro', labelKey: 'admin.tenants.plan.pro' },
        { value: 'enterprise', labelKey: 'admin.tenants.plan.enterprise' },
        { value: 'single_use', labelKey: 'admin.tenants.plan.singleUse' }
      ]
    },
    {
      key: 'isActive', labelKey: 'admin.tenants.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tenants.status.active' },
        { value: 'false', labelKey: 'admin.tenants.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TenantRow[]>(() =>
    this.facade.filteredTenants().map(t => ({
      id: t.id,
      name: t.name,
      key: t.key,
      contactEmail: t.contactEmail,
      planType: t.planType,
      planTypeLabel: `admin.tenants.plan.${t.planType === 'single_use' ? 'singleUse' : t.planType}`,
      planVariant: this.getPlanVariant(t.planType),
      statusLabel: t.isActive ? 'admin.tenants.status.active' : 'admin.tenants.status.inactive',
      statusVariant: t.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedTenants().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  private getPlanVariant(planType: string): string {
    switch (planType) {
      case 'enterprise': return 'info';
      case 'pro': return 'active';
      case 'single_use': return 'warning';
      default: return 'draft';
    }
  }

  onFiltersApplied(filters: Record<string, string>): void {
    this.facade.applyFilters({
      name: filters['name'] || undefined,
      planType: filters['planType'] || undefined,
      isActive: filters['isActive'] || undefined
    });
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: TenantRow[]): void {
    this.selectedTenants.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: TenantRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingTenant.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: TenantRow): void {
    const tenant = this.facade.tenants().find(t => t.id === row.id);
    if (tenant) {
      this.editingTenant.set(tenant);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingTenant.set(null);
  }

  async onFormSubmitted(data: Partial<Tenant>): Promise<void> {
    const existing = this.editingTenant();
    let success: boolean;
    if (existing) {
      success = await this.facade.updateTenant(existing.id, data);
    } else {
      success = await this.facade.createTenant(data as Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>);
    }
    if (success) this.closeFormPanel();
  }

  confirmDelete(row: TenantRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  executeDelete(): void {
    const id = this.deletingId();
    if (id) {
      this.facade.delete(id);
      this.showDeleteDialog.set(false);
      this.deletingId.set(null);
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  openBulkDelete(): void {
    this.showBulkDeleteDialog.set(true);
  }

  executeBulkDelete(): void {
    const ids = this.selectedTenants().map(r => r.id);
    this.facade.bulkDelete(ids);
    this.showBulkDeleteDialog.set(false);
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }
}
