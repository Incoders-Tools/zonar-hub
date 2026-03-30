import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { SocialNetwork } from '../../../../core/models';
import { SocialNetworksFacadeService, SocialNetworkFilters } from './social-networks-facade.service';
import { SocialNetworksFormDialogComponent } from './social-networks-form-dialog/social-networks-form-dialog.component';
import { SocialNetworksHelpDialogComponent } from './social-networks-help-dialog/social-networks-help-dialog.component';

interface SocialNetworkRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  url: string | null;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-social-networks-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    SocialNetworksFormDialogComponent,
    SocialNetworksHelpDialogComponent
  ],
  providers: [SocialNetworksFacadeService],
  templateUrl: './admin-social-networks-page.component.html',
  styleUrl: './admin-social-networks-page.component.scss',
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
export class AdminSocialNetworksPageComponent implements OnInit {
  readonly facade = inject(SocialNetworksFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly showHelpDialog = signal(false);
  readonly editingNetwork = signal<SocialNetwork | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedNetworks = signal<SocialNetworkRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.social-networks.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.social-networks.column.key', sortable: true },
    { key: 'url', labelKey: 'admin.social-networks.column.url', sortable: false },
    { key: 'faIcon', labelKey: 'admin.social-networks.column.icon', sortable: false },
    { key: 'sortOrder', labelKey: 'admin.social-networks.column.sortOrder', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.social-networks.column.status', sortable: true }
  ];

  readonly networkRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.social-networks.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.social-networks.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.social-networks.status.active' },
        { value: 'false', labelKey: 'admin.social-networks.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<SocialNetworkRow[]>(() =>
    this.facade.filteredNetworks().map(n => ({
      id: n.id,
      name: n.name,
      key: n.key,
      url: n.url,
      faIcon: n.faIcon,
      sortOrder: n.sortOrder,
      isActive: n.isActive,
      statusLabel: n.isActive ? 'admin.social-networks.status.active' : 'admin.social-networks.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedNetworks().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: SocialNetworkFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: SocialNetworkRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingNetwork.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: SocialNetworkRow): void {
    const network = this.facade.filteredNetworks().find(n => n.id === row.id);
    if (network) {
      this.editingNetwork.set(network);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingNetwork.set(null);
  }

  confirmDelete(row: SocialNetworkRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteNetwork(id);
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

  onSelectionChanged(rows: SocialNetworkRow[]): void {
    this.selectedNetworks.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedNetworks().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedNetworks.set([]);
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
