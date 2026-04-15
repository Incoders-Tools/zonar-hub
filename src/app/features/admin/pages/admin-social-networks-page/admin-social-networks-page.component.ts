import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { CollapsibleSectionComponent } from '../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { SocialNetwork } from '../../../../core/models';
import { SocialNetworksFacadeService, SocialNetworkFilters } from './social-networks-facade.service';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ActiveToggleComponent } from '../../../../shared/components/active-toggle/active-toggle.component';

interface SocialNetworkRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  url: string | null;
  faIcon: string | null;
  sortOrder: number | null;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-social-networks-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    FormShellComponent,
    CollapsibleSectionComponent,
    HelpButtonComponent,
    ActiveToggleComponent
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
  private readonly fb = inject(FormBuilder);
  readonly facade = inject(SocialNetworksFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingNetwork = signal<SocialNetwork | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedNetworks = signal<SocialNetworkRow[]>([]);

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'admin.social-networks.column.name', sortable: true },
      { key: 'url', labelKey: 'admin.social-networks.column.url', sortable: false },
      { key: 'faIcon', labelKey: 'admin.social-networks.column.icon', sortable: false },
      { key: 'statusLabel', labelKey: 'admin.social-networks.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'admin.social-networks.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'admin.social-networks.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

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
      statusLabel: n.isActive ? 'admin.social-networks.status.active' : 'admin.social-networks.status.inactive',
      statusVariant: n.isActive ? 'active' : 'inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedNetworks().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.social-networks.help.section1Title', contentKey: 'admin.social-networks.help.section1Text' },
    { titleKey: 'admin.social-networks.help.section2Title', contentKey: 'admin.social-networks.help.section2Text' },
    { titleKey: 'admin.social-networks.help.section3Title', items: [
      'admin.social-networks.help.section3Item1',
      'admin.social-networks.help.section3Item2',
      'admin.social-networks.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.facade.load();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      url: [''],
      faIcon: [''],
      description: [''],
      sortOrder: ['', [Validators.min(0)]],
      isActive: [true]
    });

    // Auto-generate key from name
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditing && name) {
        const generatedKey = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        this.form.get('key')?.setValue(generatedKey, { emitEvent: false });
      }
    });
  }

  private populateForm(): void {
    const network = this.editingNetwork();
    if (network) {
      this.isEditing = true;
      this.submitted = false;
      this.form.patchValue({
        name: network.name,
        key: network.key,
        url: network.url || '',
        faIcon: network.faIcon || '',
        description: network.description || '',
        sortOrder: network.sortOrder || '',
        isActive: network.isActive
      });
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      this.submitted = false;
      this.form.reset();
      this.form.get('key')?.enable();
      const nextOrder = this.facade.getNextSortOrder();
      this.form.patchValue({
        sortOrder: nextOrder,
        isActive: true
      });
    }
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
    this.populateForm();
    this.showFormPanel.set(true);
  }

  openEdit(row: SocialNetworkRow): void {
    const network = this.facade.filteredNetworks().find(n => n.id === row.id);
    if (network) {
      this.editingNetwork.set(network);
      this.populateForm();
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

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  async onFormSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();

    // Validate key uniqueness (only for new records)
    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    // Validate name uniqueness
    const nameExists = await this.facade.checkNameExists(formValue.name, this.editingNetwork()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    // Validate sort order uniqueness
    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.editingNetwork()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? {
          ...this.editingNetwork(),
          ...formValue
        }
      : formValue;

    const success = await this.facade.saveNetwork(payload);
    if (success) {
      this.closeFormPanel();
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.social-networks.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.social-networks.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return 'admin.social-networks.error.sortOrderMin';
    }
    if (control.errors['keyExists']) {
      return 'admin.social-networks.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.social-networks.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.social-networks.error.sortOrderExists';
    }

    return 'admin.social-networks.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
