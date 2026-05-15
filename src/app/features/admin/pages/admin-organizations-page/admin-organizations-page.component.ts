import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { Organization } from '../../../../core/models';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { OrganizationFacadeService, OrganizationFilters } from './organization-facade.service';
import { OrganizationFormPanelComponent, OrganizationFormSubmitData } from './organization-form-panel/organization-form-panel.component';

interface OrganizationRow extends Record<string, unknown> {
  id: string;
  displayName: string;
  legalName: string;
  type: string;
  typeLabel: string;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-organizations-page',
  standalone: true,
  imports: [
    TranslatePipe,
    MatIcon,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    OrganizationFormPanelComponent
  ],
  providers: [OrganizationFacadeService],
  templateUrl: './admin-organizations-page.component.html',
  styleUrl: './admin-organizations-page.component.scss',
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
export class AdminOrganizationsPageComponent implements OnInit {
  readonly facade = inject(OrganizationFacadeService);
  private readonly activeOrg = inject(ActiveOrganizationService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingOrganization = signal<Organization | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedOrganizations = signal<OrganizationRow[]>([]);

  constructor() {
    // Reload data and reset transient UI whenever the active organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      this.showFormPanel.set(false);
      this.showDeleteDialog.set(false);
      this.showBulkDeleteDialog.set(false);
      this.editingOrganization.set(null);
      this.deletingId.set(null);
      this.selectedOrganizations.set([]);
      void this.facade.load();
    });
  }

  readonly columns: DataTableColumn[] = [
    { key: 'displayName', labelKey: 'admin.organizations.column.displayName', sortable: true },
    { key: 'legalName', labelKey: 'admin.organizations.column.legalName', sortable: true },
    { key: 'typeLabel', labelKey: 'admin.organizations.column.type', sortable: true, renderType: 'pill', translate: true },
    { key: 'statusLabel', labelKey: 'admin.organizations.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.organizations.filter.name', type: 'text' },
    {
      key: 'type', labelKey: 'admin.organizations.filter.type', type: 'select',
      options: [
        { value: 'estandar', labelKey: 'organization.type.estandar' },
        { value: 'circuito', labelKey: 'organization.type.circuito' },
        { value: 'academia', labelKey: 'organization.type.academia' },
        { value: 'operadora', labelKey: 'organization.type.operadora' },
        { value: 'marca', labelKey: 'organization.type.marca' }
      ]
    },
    {
      key: 'isActive', labelKey: 'admin.organizations.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.organizations.status.active' },
        { value: 'false', labelKey: 'admin.organizations.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<OrganizationRow[]>(() =>
    this.facade.filteredOrganizations().map(o => ({
      id: o.id,
      displayName: o.displayName,
      legalName: o.legalName ?? '',
      type: o.type,
      typeLabel: `organization.type.${o.type}`,
      statusLabel: o.isActive ? 'admin.organizations.status.active' : 'admin.organizations.status.inactive',
      statusVariant: o.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedOrganizations().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    this.facade.applyFilters({
      name: filters['name'] || undefined,
      type: filters['type'] || undefined,
      isActive: filters['isActive'] || undefined
    });
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSelectionChanged(rows: OrganizationRow[]): void {
    this.selectedOrganizations.set(rows);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: OrganizationRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingOrganization.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: OrganizationRow): void {
    const org = this.facade.organizations().find(o => o.id === row.id);
    if (org) {
      this.editingOrganization.set(org);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingOrganization.set(null);
  }

  async onFormSubmitted(data: OrganizationFormSubmitData): Promise<void> {
    const existing = this.editingOrganization();
    let success: boolean;
    if (existing) {
      success = await this.facade.updateOrganization(existing.id, data);
    } else {
      success = await this.facade.createOrganization({
        displayName: data.displayName ?? '',
        legalName: data.legalName,
        description: data.description,
        type: data.type ?? 'circuito',
        isActive: data.isActive ?? true
      }, data.selectedSportIds);
    }
    if (success) this.closeFormPanel();
  }

  confirmDelete(row: OrganizationRow): void {
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
    const ids = this.selectedOrganizations().map(r => r.id);
    this.facade.bulkDelete(ids);
    this.showBulkDeleteDialog.set(false);
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }
}
