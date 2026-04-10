import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../shared/components/form-shell/form-shell.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ContentService } from '../../../../core/services/content.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FlyerBackground } from '../../../../core/models';

@Component({
  selector: 'app-admin-flyer-backgrounds-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AsyncButtonComponent,
    FormShellComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './admin-flyer-backgrounds-page.component.html',
  styleUrl: './admin-flyer-backgrounds-page.component.scss'
})
export class AdminFlyerBackgroundsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly content = inject(ContentService);
  private readonly notifications = inject(NotificationService);

  readonly backgrounds = this.content.flyerBackgrounds;
  readonly editing = signal<FlyerBackground | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly categoryOptions = [
    { value: 'tournament', labelKey: 'flyers.category.tournament' },
    { value: 'registration', labelKey: 'flyers.category.registration' },
    { value: 'ranking', labelKey: 'flyers.category.ranking' },
    { value: 'general', labelKey: 'flyers.category.general' }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    imageUrl: ['', [Validators.required]],
    category: ['tournament', [Validators.required]],
    isActive: [true],
    sortOrder: [0, [Validators.min(0)]]
  });

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', imageUrl: '', category: 'tournament', isActive: true, sortOrder: 0 });
    this.showForm.set(true);
  }

  openEdit(bg: FlyerBackground): void {
    this.editing.set(bg);
    this.form.patchValue({
      name: bg.name,
      imageUrl: bg.imageUrl,
      category: bg.category,
      isActive: bg.isActive,
      sortOrder: bg.sortOrder
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  async save(): Promise<void> {
    if (!this.form.valid) return;
    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      const key = values.name!
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const payload: Partial<FlyerBackground> = {
        name: values.name!,
        key,
        imageUrl: values.imageUrl!,
        thumbnailUrl: values.imageUrl!,
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
