import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { TournamentStatus } from '../../../../core/models';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TournamentStatusesFacadeService, TournamentStatusFilters } from './tournament-statuses-facade.service';

interface TournamentStatusRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-tournament-statuses-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    HelpButtonComponent
  ],
  providers: [TournamentStatusesFacadeService],
  templateUrl: './admin-tournament-statuses-page.component.html',
  styleUrl: './admin-tournament-statuses-page.component.scss',
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
export class AdminTournamentStatusesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly facade = inject(TournamentStatusesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingStatus = signal<TournamentStatus | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedStatuses = signal<TournamentStatusRow[]>([]);

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'admin.tournament-statuses.column.name', sortable: true },
      { key: 'description', labelKey: 'admin.tournament-statuses.column.description', sortable: false },
      { key: 'statusLabel', labelKey: 'admin.tournament-statuses.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'admin.tournament-statuses.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'admin.tournament-statuses.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

  readonly statusRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tournament-statuses.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-statuses.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-statuses.status.active' },
        { value: 'false', labelKey: 'admin.tournament-statuses.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentStatusRow[]>(() =>
    this.facade.filteredStatuses().map(s => ({
      id: s.id,
      name: s.name,
      key: s.key,
      description: s.description,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
      statusLabel: s.isActive ? 'admin.tournament-statuses.status.active' : 'admin.tournament-statuses.status.inactive',
      statusVariant: s.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedStatuses().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.tournament-statuses.help.section1Title', contentKey: 'admin.tournament-statuses.help.section1Text' },
    { titleKey: 'admin.tournament-statuses.help.section2Title', contentKey: 'admin.tournament-statuses.help.section2Text' },
    { titleKey: 'admin.tournament-statuses.help.section3Title', items: [
      'admin.tournament-statuses.help.section3Item1',
      'admin.tournament-statuses.help.section3Item2',
      'admin.tournament-statuses.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.facade.load();
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      description: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const status = this.editingStatus();
    if (status) {
      this.isEditing = true;
      this.form.patchValue({
        name: status.name,
        key: status.key,
        description: status.description || '',
        sortOrder: status.sortOrder || '',
        isActive: status.isActive
      });
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      this.form.reset({ name: '', key: '', description: '', sortOrder: this.facade.getNextSortOrder(), isActive: true });
      this.form.get('key')?.enable();
    }
    this.submitted = false;
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentStatusFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentStatusRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingStatus.set(null);
    this.showFormPanel.set(true);
    this.populateForm();
  }

  openEdit(row: TournamentStatusRow): void {
    const status = this.facade.filteredStatuses().find(s => s.id === row.id);
    if (status) {
      this.editingStatus.set(status);
      this.showFormPanel.set(true);
      this.populateForm();
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingStatus.set(null);
    this.submitted = false;
  }

  async onFormSave(): Promise<void> {
    this.submitted = true;
    if (!this.form.valid) return;

    const formValue = this.form.getRawValue();

    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.editingStatus()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const payload = this.isEditing
      ? { ...this.editingStatus(), ...formValue }
      : formValue;

    const success = await this.facade.saveStatus(payload);
    if (success) {
      this.closeFormPanel();
    }
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && !!control?.invalid;
  }

  confirmDelete(row: TournamentStatusRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteStatus(id);
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

  onSelectionChanged(rows: TournamentStatusRow[]): void {
    this.selectedStatuses.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedStatuses().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedStatuses.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
