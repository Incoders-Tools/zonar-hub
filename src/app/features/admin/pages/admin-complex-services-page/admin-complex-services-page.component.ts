import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { ComplexService } from '../../../../core/models';
import { ComplexServicesFacadeService, ComplexServiceFilters } from './complex-services-facade.service';
import { ComplexServicesFormDialogComponent } from './complex-services-form-dialog/complex-services-form-dialog.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';

interface ComplexServiceRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-complex-services-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    ComplexServicesFormDialogComponent,
    HelpButtonComponent
  ],
  providers: [ComplexServicesFacadeService],
  templateUrl: './admin-complex-services-page.component.html',
  styleUrl: './admin-complex-services-page.component.scss',
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
export class AdminComplexServicesPageComponent implements OnInit {
  readonly facade = inject(ComplexServicesFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingService = signal<ComplexService | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedServices = signal<ComplexServiceRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.complex-services.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.complex-services.column.key', sortable: true },
    { key: 'faIcon', labelKey: 'admin.complex-services.column.icon', sortable: false },
    { key: 'sortOrder', labelKey: 'admin.complex-services.column.sortOrder', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.complex-services.column.status', sortable: true }
  ];

  readonly serviceRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.complex-services.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.complex-services.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.complex-services.status.active' },
        { value: 'false', labelKey: 'admin.complex-services.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<ComplexServiceRow[]>(() =>
    this.facade.filteredServices().map(s => ({
      id: s.id,
      name: s.name,
      key: s.key,
      faIcon: s.faIcon,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      statusLabel: s.isActive ? 'admin.complex-services.status.active' : 'admin.complex-services.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedServices().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.complex-services.help.section1Title', contentKey: 'admin.complex-services.help.section1Text' },
    { titleKey: 'admin.complex-services.help.section2Title', contentKey: 'admin.complex-services.help.section2Text' },
    { titleKey: 'admin.complex-services.help.section3Title', items: [
      'admin.complex-services.help.section3Item1',
      'admin.complex-services.help.section3Item2',
      'admin.complex-services.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: ComplexServiceFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: ComplexServiceRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingService.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: ComplexServiceRow): void {
    const service = this.facade.filteredServices().find(s => s.id === row.id);
    if (service) {
      this.editingService.set(service);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingService.set(null);
  }

  confirmDelete(row: ComplexServiceRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteService(id);
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

  onSelectionChanged(rows: ComplexServiceRow[]): void {
    this.selectedServices.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedServices().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedServices.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
