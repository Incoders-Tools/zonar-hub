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
import { TournamentType } from '../../../../core/models';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TournamentTypesFacadeService, TournamentTypeFilters } from './tournament-types-facade.service';
import { ActiveToggleComponent } from '../../../../shared/components/active-toggle/active-toggle.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../shared/components/child-collection-grid/child-collection-grid.component';

interface TournamentTypeRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  sortOrder: number | null;
  isActive: boolean;
  scoresPoints: boolean;
  appliesGender: boolean;
  statusLabel: string;
  statusVariant: string;
  scoresPointsLabel: string;
  appliesGenderLabel: string;
}

@Component({
  selector: 'app-admin-tournament-types-page',
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
    HelpButtonComponent,
    ActiveToggleComponent,
    ChildCollectionGridComponent
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
  private readonly fb = inject(FormBuilder);
  readonly facade = inject(TournamentTypesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingType = signal<TournamentType | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedTypes = signal<TournamentTypeRow[]>([]);

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly selectedSportIds = signal<Set<string>>(new Set());

  readonly sportColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.sports.column.name', type: 'display' },
    { key: 'icon', labelKey: 'admin.sports.column.icon', type: 'display' }
  ];

  readonly sportItems = computed(() =>
    this.facade.sports().filter(s => s.isActive)
  );

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'admin.tournament-types.column.name', sortable: true },
      { key: 'scoresPointsLabel', labelKey: 'admin.tournament-types.column.scoresPoints', sortable: false, translate: true },
      { key: 'appliesGenderLabel', labelKey: 'admin.tournament-types.column.appliesGender', sortable: false, translate: true },
      { key: 'statusLabel', labelKey: 'admin.tournament-types.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'admin.tournament-types.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'admin.tournament-types.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

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
      statusVariant: t.isActive ? 'active' : 'inactive',
      scoresPointsLabel: t.scoresPoints ? 'common.yes' : 'common.no',
      appliesGenderLabel: t.appliesGender ? 'common.yes' : 'common.no'
    }))
  );

  readonly hasSelection = computed(() => this.selectedTypes().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.tournament-types.help.section1Title', contentKey: 'admin.tournament-types.help.section1Text' },
    { titleKey: 'admin.tournament-types.help.section2Title', contentKey: 'admin.tournament-types.help.section2Text' },
    { titleKey: 'admin.tournament-types.help.section3Title', items: [
      'admin.tournament-types.help.section3Item1',
      'admin.tournament-types.help.section3Item2',
      'admin.tournament-types.help.section3Item3'
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
      sortOrder: ['', [Validators.min(0)]],
      scoresPoints: [false],
      appliesGender: [false],
      isActive: [true]
    });
  }

  private populateForm(): void {
    const type = this.editingType();
    if (type) {
      this.isEditing = true;
      this.form.patchValue({
        name: type.name,
        key: type.key,
        sortOrder: type.sortOrder || '',
        scoresPoints: type.scoresPoints,
        appliesGender: type.appliesGender,
        isActive: type.isActive
      });
      this.form.get('key')?.disable();
      // Load sport selections
      this.selectedSportIds.set(new Set(type.sportIds ?? (type.sportId ? [type.sportId] : [])));
    } else {
      this.isEditing = false;
      this.form.reset({ name: '', key: '', sortOrder: this.facade.getNextSortOrder(), scoresPoints: false, appliesGender: false, isActive: true });
      this.form.get('key')?.enable();
      this.selectedSportIds.set(new Set());
    }
    this.submitted = false;
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
    this.populateForm();
  }

  openEdit(row: TournamentTypeRow): void {
    const type = this.facade.filteredTypes().find(t => t.id === row.id);
    if (type) {
      this.editingType.set(type);
      this.showFormPanel.set(true);
      this.populateForm();
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingType.set(null);
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

    const nameExists = await this.facade.checkNameExists(formValue.name, this.editingType()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const payload = this.isEditing
      ? { ...this.editingType(), ...formValue, sportIds: [...this.selectedSportIds()] }
      : { ...formValue, sportIds: [...this.selectedSportIds()] };

    const success = await this.facade.saveType(payload);
    if (success) {
      this.closeFormPanel();
    }
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && !!control?.invalid;
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

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  onSportSelectionChanged(ids: Set<string>): void {
    this.selectedSportIds.set(ids);
  }
}
