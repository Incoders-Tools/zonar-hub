import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ActiveToggleComponent } from '../../../../shared/components/active-toggle/active-toggle.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TournamentRule } from '../../../../core/models/tournament-rule.model';
import { TournamentRulesFacadeService, TournamentRulesFilters } from './tournament-rules-facade.service';

interface TournamentRuleRow extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  statusLabel: string;
  statusVariant: string;
  isActive: boolean;
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
    TranslatePipe,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    FormShellComponent,
    HelpButtonComponent,
    ActiveToggleComponent
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
  readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isSystemAdmin = this.auth.isSystemAdmin;
  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingRule = signal<TournamentRule | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedRules = signal<TournamentRuleRow[]>([]);

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tournament-rules.column.name', sortable: true },
    { key: 'description', labelKey: 'admin.tournament-rules.column.description', sortable: false },
    { key: 'sortOrder', labelKey: 'admin.tournament-rules.column.sortOrder', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.tournament-rules.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly ruleRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tournament-rules.column.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-rules.column.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-rules.status.active' },
        { value: 'false', labelKey: 'admin.tournament-rules.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentRuleRow[]>(() => {
    const locale = this.i18n.locale();
    return this.facade.filteredRules().map(r => ({
      id: r.id,
      name: r.name,
      description: this.localizedDescription(r, locale),
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      statusLabel: r.isActive ? 'admin.tournament-rules.status.active' : 'admin.tournament-rules.status.inactive',
      statusVariant: r.isActive ? 'active' : 'inactive',
      createdAt: r.createdAt
    }));
  });

  readonly hasSelection = computed(() => this.selectedRules().length > 0);

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
      name: ['', [Validators.required]],
      descriptionEs: [''],
      descriptionEn: [''],
      descriptionPt: [''],
      sortOrder: [0, [Validators.min(0)]],
      isActive: [true]
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      descriptionEs: '',
      descriptionEn: '',
      descriptionPt: '',
      sortOrder: this.facade.getNextSortOrder(),
      isActive: true
    });
    this.submitted = false;
    this.isEditing = false;
  }

  private localizedDescription(rule: TournamentRule, locale: string): string {
    if (locale === 'en' && rule.descriptionEn) return rule.descriptionEn;
    if (locale === 'pt' && rule.descriptionPt) return rule.descriptionPt;
    if (rule.descriptionEs) return rule.descriptionEs;
    return rule.descriptionEn ?? rule.descriptionPt ?? '';
  }

  /** Translation key for the description label that matches the active locale.
   *  When the user is not a system_admin we only let them edit a single locale. */
  readonly localeDescriptionControlName = computed(() => {
    const locale = this.i18n.locale();
    if (locale === 'en') return 'descriptionEn';
    if (locale === 'pt') return 'descriptionPt';
    return 'descriptionEs';
  });

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentRulesFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentRuleRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingRule.set(null);
    this.resetForm();
    this.showFormPanel.set(true);
  }

  openEdit(row: TournamentRuleRow): void {
    const rule = this.facade.entities().find(r => r.id === row.id);
    if (rule) {
      this.editingRule.set(rule);
      this.isEditing = true;
      this.submitted = false;
      this.form.patchValue({
        name: rule.name,
        descriptionEs: rule.descriptionEs ?? '',
        descriptionEn: rule.descriptionEn ?? '',
        descriptionPt: rule.descriptionPt ?? '',
        sortOrder: rule.sortOrder,
        isActive: rule.isActive
      });
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingRule.set(null);
    this.resetForm();
  }

  confirmDelete(row: TournamentRuleRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteRule(id);
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

  onSelectionChanged(rows: TournamentRuleRow[]): void {
    this.selectedRules.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedRules().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedRules.set([]);
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
    if (!this.form.valid) return;

    const formValue = this.form.getRawValue();
    const nameExists = await this.facade.checkNameExists(formValue.name, this.editingRule()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    // For non-sysadmin admins we mirror the active-locale description into the
    // missing locales so the row stays consistent until a sysadmin completes
    // the translations from another login.
    const activeLocale = this.i18n.locale();
    if (!this.isSystemAdmin()) {
      const fallback = (formValue.descriptionEs || formValue.descriptionEn || formValue.descriptionPt || '').trim();
      formValue.descriptionEs = activeLocale === 'es' ? formValue.descriptionEs : (formValue.descriptionEs || fallback);
      formValue.descriptionEn = activeLocale === 'en' ? formValue.descriptionEn : (formValue.descriptionEn || fallback);
      formValue.descriptionPt = activeLocale === 'pt' ? formValue.descriptionPt : (formValue.descriptionPt || fallback);
    }

    const payload = this.isEditing
      ? { ...this.editingRule()!, ...formValue }
      : formValue;

    const success = await this.facade.saveRule(payload);
    if (success) {
      this.closeFormPanel();
    }
  }

  onCancel(): void {
    this.closeFormPanel();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) return '';
    if (control.errors['required']) return `admin.tournament-rules.error.${controlName}Required`;
    if (control.errors['nameExists']) return 'admin.tournament-rules.error.nameExists';
    if (control.errors['min']) return 'admin.tournament-rules.error.sortOrderMin';
    return 'admin.tournament-rules.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && !!control?.invalid;
  }
}
