import { Component, inject, signal, computed, OnInit, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { Complex } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { ComplexesFacadeService, ComplexFilters } from './complexes-facade.service';
import { ComplexesFormPanelComponent } from './complexes-form-panel/complexes-form-panel.component';
import { ComplexCourtsPanelComponent } from './complex-courts-panel/complex-courts-panel.component';
import { CourtAvailabilityGridComponent } from './court-availability-grid/court-availability-grid.component';

interface ComplexRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  location: string;
  sortOrder: number;
  preponderance: number;
  courtsCount: number;
  statusLabel: string;
  statusVariant: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-complexes-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    ComplexesFormPanelComponent,
    ComplexCourtsPanelComponent,
    CourtAvailabilityGridComponent
  ],
  providers: [ComplexesFacadeService],
  templateUrl: './admin-complexes-page.component.html',
  styleUrl: './admin-complexes-page.component.scss',
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
export class AdminComplexesPageComponent implements OnInit {
  readonly facade = inject(ComplexesFacadeService);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  private readonly formPanel = viewChild(ComplexesFormPanelComponent);
  readonly showFormPanel = signal(false);

  formPanelSavePending(): boolean {
    return this.showFormPanel() && !!this.formPanel()?.savePending();
  }

  private get formSavePending(): boolean {
    return this.formPanelSavePending();
  }
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingComplex = signal<Complex | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    // Reload data and reset transient UI whenever the active organization changes
    effect(() => {
      this.activeOrg.organizationChanged();
      this.showFormPanel.set(false);
      this.showDeleteDialog.set(false);
      this.showBulkDeleteDialog.set(false);
      this.editingComplex.set(null);
      this.deletingId.set(null);
      this.selectedComplexes.set([]);
      this.closeCourtsPanel();
      this.facade.invalidateCourts();
      void this.facade.load();
    });
  }
  readonly selectedComplexes = signal<ComplexRow[]>([]);

  // Courts panel state
  readonly courtsComplexId = signal<string | null>(null);
  readonly courtsComplexName = signal<string>('');

  // Availability grid state
  readonly availabilityCourtId = signal<string | null>(null);

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'admin.complexes.column.name', sortable: true },
      { key: 'location', labelKey: 'admin.complexes.column.location', sortable: false },
      { key: 'courtsCount', labelKey: 'admin.complexes.column.courtsCount', sortable: false },
      { key: 'statusLabel', labelKey: 'admin.complexes.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'admin.complexes.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'admin.complexes.column.sortOrder', sortable: true },
        { key: 'preponderance', labelKey: 'admin.complexes.column.preponderance', sortable: true }
      );
    }
    return base;
  });

  readonly complexRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'stadium', labelKey: 'admin.complexes.action.courts', action: 'courts', variant: 'default' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields = computed<FilterField[]>(() => [
    { key: 'name', labelKey: 'admin.complexes.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.complexes.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.complexes.status.active' },
        { value: 'false', labelKey: 'admin.complexes.status.inactive' }
      ]
    }
  ]);

  readonly tableData = computed<ComplexRow[]>(() =>
    this.facade.filteredComplexes().map(c => ({
      id: c.id,
      name: c.name,
      key: c.key,
      location: c.location || '',
      sortOrder: c.sortOrder,
      preponderance: c.preponderance,
      courtsCount: c.courtsCount,
      isActive: c.isActive,
      statusLabel: c.isActive ? 'admin.complexes.status.active' : 'admin.complexes.status.inactive',
      statusVariant: c.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedComplexes().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.complexes.help.section1Title', contentKey: 'admin.complexes.help.section1Text' },
    { titleKey: 'admin.complexes.help.section2Title', contentKey: 'admin.complexes.help.section2Text' },
    { titleKey: 'admin.complexes.help.section3Title', items: [
      'admin.complexes.help.section3Item1',
      'admin.complexes.help.section3Item2',
      'admin.complexes.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  // --- Filters ---

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: ComplexFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  // --- Row Actions ---

  onRowActionClicked(event: { action: string; row: ComplexRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    } else if (event.action === 'courts') {
      this.toggleCourtsPanel(event.row);
    }
  }

  // --- Create / Edit ---

  openCreate(): void {
    if (this.formSavePending) return;
    this.editingComplex.set(null);
    this.showFormPanel.set(true);
    this.closeCourtsPanel();
  }

  openEdit(row: ComplexRow): void {
    if (this.formSavePending) return;
    const complex = this.facade.filteredComplexes().find(c => c.id === row.id);
    if (complex) {
      this.editingComplex.set(complex);
      this.showFormPanel.set(true);
      this.closeCourtsPanel();
    }
  }

  closeFormPanel(): void {
    if (this.formSavePending) return;
    this.dismissFormPanel();
  }

  onFormSaved(): void {
    this.dismissFormPanel();
  }

  private dismissFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingComplex.set(null);
  }

  // --- Delete ---

  confirmDelete(row: ComplexRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteComplex(id);
      if (success) {
        this.showDeleteDialog.set(false);
        this.deletingId.set(null);
        // Close courts panel if it was showing this complex
        if (this.courtsComplexId() === id) {
          this.closeCourtsPanel();
        }
      }
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  // --- Bulk Delete ---

  onSelectionChanged(rows: ComplexRow[]): void {
    this.selectedComplexes.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedComplexes().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedComplexes.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  // --- Sort ---

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  // --- Courts Panel ---

  toggleCourtsPanel(row: ComplexRow): void {
    if (this.formSavePending) return;
    if (this.courtsComplexId() === row.id) {
      this.closeCourtsPanel();
      return;
    }

    this.showFormPanel.set(false);
    this.editingComplex.set(null);
    this.courtsComplexId.set(row.id);
    this.courtsComplexName.set(row.name);
    this.availabilityCourtId.set(null);
    this.facade.loadCourts(row.id);
  }

  closeCourtsPanel(): void {
    this.courtsComplexId.set(null);
    this.courtsComplexName.set('');
    this.availabilityCourtId.set(null);
  }

  async onCourtSaved(court: any): Promise<void> {
    await this.facade.saveCourt(court);
  }

  async onCourtDeleted(id: string): Promise<void> {
    await this.facade.deleteCourt(id);
    // Close availability if it was for this court
    if (this.availabilityCourtId() === id) {
      this.availabilityCourtId.set(null);
    }
  }

  // --- Availability ---

  onAvailabilityRequested(courtId: string): void {
    if (this.availabilityCourtId() === courtId) {
      this.availabilityCourtId.set(null);
      return;
    }
    this.availabilityCourtId.set(courtId);
    this.facade.loadAvailability(courtId);
  }

  async onAvailabilitySaved(slots: any[]): Promise<void> {
    const courtId = this.availabilityCourtId();
    if (courtId) {
      await this.facade.saveAvailabilitySlots(courtId, slots);
    }
  }
}
