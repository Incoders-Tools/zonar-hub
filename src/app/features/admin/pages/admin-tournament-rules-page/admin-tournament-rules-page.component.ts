import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TournamentRuleSet } from '../../../../core/models';
import { TournamentRulesFacadeService, TournamentRuleSetFilters } from './tournament-rules-facade.service';

interface TournamentRuleSetRow extends Record<string, unknown> {
  id: string;
  tournamentTypeName: string;
  isActive: boolean;
  statusLabel: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-tournament-rules-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    FormShellComponent,
    HelpButtonComponent
  ],
  providers: [TournamentRulesFacadeService],
  templateUrl: './admin-tournament-rules-page.component.html',
  styleUrl: './admin-tournament-rules-page.component.scss',
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
export class AdminTournamentRulesPageComponent implements OnInit {
  readonly facade = inject(TournamentRulesFacadeService);
  private readonly fb = inject(FormBuilder);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingRuleSet = signal<TournamentRuleSet | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedRuleSets = signal<TournamentRuleSetRow[]>([]);

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly columns: DataTableColumn[] = [
    { key: 'tournamentTypeName', labelKey: 'admin.tournament-rules.column.tournamentType', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.tournament-rules.column.status', sortable: true },
    { key: 'createdAt', labelKey: 'admin.tournament-rules.column.createdAt', sortable: true }
  ];

  readonly ruleSetRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'tournamentTypeName', labelKey: 'admin.tournament-rules.column.tournamentType', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-rules.column.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-rules.status.active' },
        { value: 'false', labelKey: 'admin.tournament-rules.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentRuleSetRow[]>(() =>
    this.facade.filteredRuleSets().map(r => ({
      id: r.id,
      tournamentTypeName: r.tournamentTypeName,
      isActive: r.isActive,
      statusLabel: r.isActive ? 'admin.tournament-rules.status.active' : 'admin.tournament-rules.status.inactive',
      createdAt: r.createdAt
    }))
  );

  readonly hasSelection = computed(() => this.selectedRuleSets().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.tournament-rules.help.section1Title', contentKey: 'admin.tournament-rules.help.section1Text' },
    { titleKey: 'admin.tournament-rules.help.section2Title', contentKey: 'admin.tournament-rules.help.section2Text' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.facade.load();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      tournamentTypeId: ['', [Validators.required]],
      rulesJson: ['', [Validators.required]],
      descriptionText: ['', [Validators.required]],
      isActive: [true]
    });
  }

  private resetForm(): void {
    this.form.reset({ tournamentTypeId: '', rulesJson: '', descriptionText: '', isActive: true });
    this.submitted = false;
    this.isEditing = false;
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentRuleSetFilters = {
      tournamentTypeName: filters['tournamentTypeName'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentRuleSetRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingRuleSet.set(null);
    this.resetForm();
    this.showFormPanel.set(true);
  }

  openEdit(row: TournamentRuleSetRow): void {
    const ruleSet = this.facade.filteredRuleSets().find(r => r.id === row.id);
    if (ruleSet) {
      this.editingRuleSet.set(ruleSet);
      this.isEditing = true;
      this.submitted = false;
      this.form.patchValue({
        tournamentTypeId: ruleSet.tournamentTypeId,
        rulesJson: ruleSet.rulesJson,
        descriptionText: ruleSet.descriptionText,
        isActive: ruleSet.isActive
      });
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingRuleSet.set(null);
    this.resetForm();
  }

  confirmDelete(row: TournamentRuleSetRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteRuleSet(id);
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

  onSelectionChanged(rows: TournamentRuleSetRow[]): void {
    this.selectedRuleSets.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedRuleSets().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedRuleSets.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload = this.isEditing
      ? { ...this.editingRuleSet(), ...formValue }
      : formValue;

    const success = await this.facade.saveRuleSet(payload);
    if (success) {
      this.closeFormPanel();
    }
  }

  onCancel(): void {
    this.closeFormPanel();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.tournament-rules.error.${controlName}Required`;
    }

    return 'admin.tournament-rules.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
