import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EmailTemplate } from '../../../../core/models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DataTableColumn, DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { FilterField, FilterPanelComponent } from '../../../../shared/components/filter-panel/filter-panel.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { EmailTemplateFilters, EmailTemplatesFacadeService } from './email-templates-facade.service';

interface EmailTemplateRow extends Record<string, unknown> {
  id: string;
  key: string;
  subject: string;
  description: string;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-admin-email-templates-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    AsyncButtonComponent,
    HelpButtonComponent,
    ConfirmDialogComponent
  ],
  providers: [EmailTemplatesFacadeService],
  templateUrl: './admin-email-templates-page.component.html',
  styleUrl: './admin-email-templates-page.component.scss',
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
export class AdminEmailTemplatesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly facade = inject(EmailTemplatesFacadeService);
  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly editingTemplate = signal<EmailTemplate | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly columns: DataTableColumn[] = [
    { key: 'key', labelKey: 'admin.email-templates.column.key', sortable: true },
    { key: 'subject', labelKey: 'admin.email-templates.column.subject', sortable: true },
    { key: 'description', labelKey: 'admin.email-templates.column.description', sortable: false },
    {
      key: 'statusLabel',
      labelKey: 'admin.email-templates.column.status',
      sortable: true,
      renderType: 'pill',
      translate: true,
      pillVariantKey: 'statusVariant'
    }
  ];

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'key', labelKey: 'admin.email-templates.filter.key', type: 'text' },
    {
      key: 'isActive',
      labelKey: 'admin.email-templates.filter.status',
      type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.email-templates.status.active' },
        { value: 'false', labelKey: 'admin.email-templates.status.inactive' }
      ]
    }
  ];

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.email-templates.help.section1Title', contentKey: 'admin.email-templates.help.section1Text' },
    { titleKey: 'admin.email-templates.help.section2Title', contentKey: 'admin.email-templates.help.section2Text' },
    { titleKey: 'admin.email-templates.help.section3Title', contentKey: 'admin.email-templates.help.section3Text' }
  ];

  readonly tableData = computed<EmailTemplateRow[]>(() =>
    this.facade.filteredTemplates().map(template => ({
      id: template.id,
      key: template.key,
      subject: template.subject,
      description: template.description ?? '—',
      statusLabel: template.isActive
        ? 'admin.email-templates.status.active'
        : 'admin.email-templates.status.inactive',
      statusVariant: template.isActive ? 'active' : 'inactive'
    }))
  );

  readonly form = this.fb.nonNullable.group({
    key: ['', [Validators.required]],
    subject: ['', [Validators.required]],
    description: [''],
    htmlBody: ['', [Validators.required]],
    isActive: [true]
  });

  submitted = false;

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: EmailTemplateFilters = {
      key: filters['key'] || undefined,
      isActive: filters['isActive'] || undefined
    };

    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: EmailTemplateRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row.id);
    } else if (event.action === 'delete') {
      this.openDeleteDialog(event.row.id);
    }
  }

  openCreateForm(): void {
    this.editingTemplate.set(null);
    this.submitted = false;
    this.form.reset({
      key: '',
      subject: '',
      description: '',
      htmlBody: '',
      isActive: true
    });
    this.form.get('key')?.enable();
    this.showFormPanel.set(true);
  }

  openEdit(id: string): void {
    const template = this.facade.templates().find(item => item.id === id);
    if (!template) {
      return;
    }

    this.editingTemplate.set(template);
    this.submitted = false;
    this.form.reset({
      key: template.key,
      subject: template.subject,
      description: template.description ?? '',
      htmlBody: template.htmlBody,
      isActive: template.isActive
    });
    this.form.get('key')?.disable();
    this.showFormPanel.set(true);
  }

  openDeleteDialog(id: string): void {
    this.deletingId.set(id);
    this.showDeleteDialog.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingTemplate.set(null);
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const current = this.editingTemplate();
    const value = this.form.getRawValue();
    
    let success = false;

    if (current) {
      // Update existing template
      success = await this.facade.updateTemplate(current.id, {
        subject: value.subject,
        description: value.description || null,
        htmlBody: value.htmlBody,
        isActive: value.isActive
      });
    } else {
      // Create new template
      success = await this.facade.createTemplate({
        key: value.key,
        subject: value.subject,
        description: value.description || null,
        htmlBody: value.htmlBody,
        isActive: value.isActive
      });
    }

    if (success) {
      this.notifications.success('toast.saveSuccess');
      this.closeFormPanel();
    }
  }

  async onDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) {
      return;
    }

    const success = await this.facade.deleteTemplate(id);

    if (success) {
      this.notifications.success('toast.deleteSuccess');
      this.closeDeleteDialog();
    }
  }

  get keyInvalid(): boolean {
    const field = this.form.controls.key;
    return field.invalid && (field.touched || this.submitted);
  }

  get subjectInvalid(): boolean {
    const field = this.form.controls.subject;
    return field.invalid && (field.touched || this.submitted);
  }

  get htmlBodyInvalid(): boolean {
    const field = this.form.controls.htmlBody;
    return field.invalid && (field.touched || this.submitted);
  }
}
