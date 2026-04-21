import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { ActiveToggleComponent } from '../../../../shared/components/active-toggle/active-toggle.component';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { ContentService } from '../../../../core/services/content.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { FlyerBackground } from '../../../../core/models';

interface FlyerRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  category: string;
  categoryLabel: string;
  isActive: boolean;
  statusLabel: string;
  statusVariant: string;
  sortOrder: number;
  thumbnailUrl: string;
}

interface FlyerFilters {
  name?: string;
  category?: string;
  isActive?: string;
}

@Component({
  selector: 'app-admin-flyer-backgrounds-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIcon,
    TranslatePipe,
    AsyncButtonComponent,
    FormShellComponent,
    ConfirmDialogComponent,
    DataTableComponent,
    FilterPanelComponent,
    HelpButtonComponent,
    ActiveToggleComponent,
    ImageUploadComponent
  ],
  templateUrl: './admin-flyer-backgrounds-page.component.html',
  styleUrl: './admin-flyer-backgrounds-page.component.scss',
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
export class AdminFlyerBackgroundsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly content = inject(ContentService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly isSystemAdmin = this.auth.isSystemAdmin;
  readonly backgrounds = this.content.flyerBackgrounds;
  readonly editing = signal<FlyerBackground | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly confirmDeleteId = signal<string | null>(null);
  private readonly filtersState = signal<FlyerFilters>({});

  readonly categoryOptions = [
    { value: 'tournament', labelKey: 'flyers.category.tournament' },
    { value: 'registration', labelKey: 'flyers.category.registration' },
    { value: 'ranking', labelKey: 'flyers.category.ranking' },
    { value: 'general', labelKey: 'flyers.category.general' }
  ];

  readonly columns = computed<DataTableColumn[]>(() => {
    const base: DataTableColumn[] = [
      { key: 'name', labelKey: 'flyers.column.name', sortable: true },
      { key: 'categoryLabel', labelKey: 'flyers.column.category', sortable: true, renderType: 'pill', translate: true },
      { key: 'statusLabel', labelKey: 'flyers.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
    ];
    if (this.isSystemAdmin()) {
      base.push(
        { key: 'key', labelKey: 'flyers.column.key', sortable: true },
        { key: 'sortOrder', labelKey: 'flyers.column.sortOrder', sortable: true }
      );
    }
    return base;
  });

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'flyers.filter.name', type: 'text' },
    {
      key: 'category', labelKey: 'flyers.filter.category', type: 'select',
      options: [
        { value: 'tournament', labelKey: 'flyers.category.tournament' },
        { value: 'registration', labelKey: 'flyers.category.registration' },
        { value: 'ranking', labelKey: 'flyers.category.ranking' },
        { value: 'general', labelKey: 'flyers.category.general' }
      ]
    },
    {
      key: 'isActive', labelKey: 'flyers.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'common.active' },
        { value: 'false', labelKey: 'common.inactive' }
      ]
    }
  ];

  readonly helpSections: HelpSection[] = [
    { titleKey: 'flyers.help.section1Title', contentKey: 'flyers.help.section1Text' },
    { titleKey: 'flyers.help.section2Title', contentKey: 'flyers.help.section2Text' }
  ];

  readonly filteredBackgrounds = computed(() => {
    const all = this.backgrounds();
    const f = this.filtersState();
    let result = [...all];

    if (f.name) {
      const term = f.name.toLowerCase();
      result = result.filter(bg => bg.name.toLowerCase().includes(term));
    }
    if (f.category) {
      result = result.filter(bg => bg.category === f.category);
    }
    if (f.isActive !== undefined) {
      const active = f.isActive === 'true';
      result = result.filter(bg => bg.isActive === active);
    }

    return result;
  });

  readonly tableData = computed<FlyerRow[]>(() =>
    this.filteredBackgrounds().map(bg => ({
      id: bg.id,
      name: bg.name,
      key: bg.key,
      category: bg.category,
      categoryLabel: 'flyers.category.' + bg.category,
      isActive: bg.isActive,
      statusLabel: bg.isActive ? 'common.active' : 'common.inactive',
      statusVariant: bg.isActive ? 'active' : 'inactive',
      sortOrder: bg.sortOrder,
      thumbnailUrl: bg.thumbnailUrl
    }))
  );

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    imageUrl: [''],
    category: ['tournament', [Validators.required]],
    isActive: [true],
    sortOrder: [0, [Validators.min(0)]]
  });

  readonly uploadedImageDataUrl = signal<string | null>(null);

  readonly formValid = computed(() => {
    const hasImage = !!this.uploadedImageDataUrl() || !!this.editing()?.imageUrl;
    return this.form.valid && hasImage;
  });

  ngOnInit(): void {
    // backgrounds are already loaded via ContentService
  }

  onFiltersApplied(filters: Record<string, string>): void {
    this.filtersState.set({
      name: filters['name'] || undefined,
      category: filters['category'] || undefined,
      isActive: filters['isActive'] || undefined
    });
  }

  onFiltersCleared(): void {
    this.filtersState.set({});
  }

  onRowAction(event: { action: string; row: FlyerRow }): void {
    if (event.action === 'edit') {
      const bg = this.backgrounds().find(b => b.id === event.row.id);
      if (bg) this.openEdit(bg);
    } else if (event.action === 'delete') {
      this.requestDelete(event.row.id);
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.uploadedImageDataUrl.set(null);
    this.form.reset({ name: '', imageUrl: '', category: 'tournament', isActive: true, sortOrder: 0 });
    this.showForm.set(true);
  }

  openEdit(bg: FlyerBackground): void {
    this.editing.set(bg);
    this.uploadedImageDataUrl.set(null);
    this.form.patchValue({
      name: bg.name,
      imageUrl: bg.imageUrl,
      category: bg.category,
      isActive: bg.isActive,
      sortOrder: bg.sortOrder
    });
    this.showForm.set(true);
  }

  onImageChanged(event: { file: File; previewUrl: string }): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.uploadedImageDataUrl.set(dataUrl);
      this.form.patchValue({ imageUrl: dataUrl });
    };
    reader.readAsDataURL(event.file);
  }

  onImageRemoved(): void {
    this.uploadedImageDataUrl.set(null);
    this.form.patchValue({ imageUrl: '' });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  async save(): Promise<void> {
    if (!this.formValid()) return;
    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      const key = values.name!
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const imageUrl = this.uploadedImageDataUrl() || this.editing()?.imageUrl || values.imageUrl!;
      const payload: Partial<FlyerBackground> = {
        name: values.name!,
        key,
        imageUrl,
        thumbnailUrl: imageUrl,
        category: values.category as FlyerBackground['category'],
        isActive: values.isActive!,
        sortOrder: values.sortOrder!
      };
      if (this.editing()) {
        payload.id = this.editing()!.id;
      }
      await this.content.saveFlyerBackground(payload);
      this.notifications.success(this.editing() ? 'flyers.toast.updated' : 'flyers.toast.created');
      this.showForm.set(false);
      this.editing.set(null);
    } catch {
      this.notifications.error('flyers.toast.error');
    } finally {
      this.saving.set(false);
    }
  }

  requestDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleting.set(true);
    try {
      await this.content.deleteFlyerBackground(id);
      this.notifications.success('flyers.toast.deleted');
    } catch {
      this.notifications.error('flyers.toast.error');
    } finally {
      this.deleting.set(false);
      this.confirmDeleteId.set(null);
    }
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }
}
