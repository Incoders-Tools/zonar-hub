import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { ImageUploadComponent } from '../../../../../shared/components/image-upload/image-upload.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { Complex, Court, Sport } from '../../../../../core/models';
import { ComplexesFacadeService, CourtDraft } from '../complexes-facade.service';
import { ComplexCourtsPanelComponent } from '../complex-courts-panel/complex-courts-panel.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { FILE_STORAGE_REPOSITORY } from '../../../../../core/repositories/file-storage.repository';
import { ImageOptimizationService } from '../../../../../core/services/image-optimization.service';
import { ActiveOrganizationService } from '../../../../../core/services/active-organization.service';

@Component({
  selector: 'app-complexes-form-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    ActiveToggleComponent,
    ImageUploadComponent,
    ComplexCourtsPanelComponent
  ],
  templateUrl: './complexes-form-panel.component.html',
  styleUrl: './complexes-form-panel.component.scss',
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
export class ComplexesFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ComplexesFacadeService);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  private readonly fileStorage = inject(FILE_STORAGE_REPOSITORY);
  private readonly imageOptimization = inject(ImageOptimizationService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly complex = input<Complex | null>(null);
  readonly saving = input(false);
  readonly sports = input<Sport[]>([]);
  readonly courtDrafts = signal<(CourtDraft & { clientId: string })[]>([]);
  readonly deletedCourtIds = signal<string[]>([]);
  readonly courtsLoading = signal(false);
  readonly courtsLoadFailed = signal(false);
  readonly courtEditorOpen = signal(false);
  readonly courtsChanged = signal(false);
  private nextClientId = 0;
  private loadVersion = 0;
  readonly savePending = signal(false);

  get courtMutationsBlocked(): boolean {
    return this.courtsLoading() || this.courtsLoadFailed() || this.saving() || this.savePending();
  }

  get draftCourts(): Court[] {
    return this.courtDrafts().map(({ clientId, ...court }) => ({ ...court, id: clientId }));
  }

  onCourtSaved(court: Court | Omit<Court, 'id'>): void {
    if (this.courtMutationsBlocked) return;
    const id = 'id' in court ? court.id : null;
    const existing = this.courtDrafts().find(item => item.clientId === id);
    const clientId = existing?.clientId ?? `draft-${++this.nextClientId}`;
    const persistedId = existing?.id ?? null;
    this.courtsChanged.set(true);
    this.courtDrafts.update(items => {
      const next = { ...court, id: persistedId, clientId } as CourtDraft & { clientId: string };
      return existing ? items.map(item => item.clientId === clientId ? next : item) : [...items, next];
    });
  }

  onCourtDeleted(clientId: string): void {
    if (this.courtMutationsBlocked) return;
    const court = this.courtDrafts().find(item => item.clientId === clientId);
    if (!court) return;
    this.courtsChanged.set(true);
    if (court.id) this.deletedCourtIds.update(ids => [...ids, court.id!]);
    this.courtDrafts.update(items => items.filter(item => item.clientId !== clientId));
  }

  async retryCourtsLoad(): Promise<void> {
    const id = this.complex()?.id;
    if (!id || this.courtsLoading() || this.courtsChanged()) return;
    const version = ++this.loadVersion;
    this.courtsLoading.set(true);
    this.courtsLoadFailed.set(false);
    try {
      const loaded = await this.facade.loadCourts(id);
      if (version !== this.loadVersion || this.complex()?.id !== id || this.courtsChanged()) return;
      if (!loaded) {
        this.courtsLoadFailed.set(true);
        return;
      }
      this.courtDrafts.set(this.facade.courts().map(court => ({ ...court, clientId: court.id })));
      this.courtsChanged.set(false);
    } catch {
      if (version === this.loadVersion) this.courtsLoadFailed.set(true);
    } finally {
      if (version === this.loadVersion) this.courtsLoading.set(false);
    }
  }

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;
  /** Holds the selected logo File before it is uploaded to storage. */
  readonly pendingLogoFile = signal<File | null>(null);

  /** Current logo URL from the loaded complex (used as preview before a new file is chosen). */
  get currentLogoUrl(): string | null {
    return this.complex()?.logoImagePath ?? null;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
    void this.retryCourtsLoad();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, Validators.pattern(/^[a-z_][a-z0-9_]*$/)]],
      location: [''],
      address: [''],
      sortOrder: [0, [Validators.min(0)]],
      preponderance: [0, [Validators.min(0)]],
      description: ['', [Validators.maxLength(80)]],
      isActive: [true],
      logoImagePath: [''],
      coverImagePath: [''],
      layoutDiagramPath: ['']
    });

    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditing && name) {
        const key = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        this.form.get('key')?.setValue(key, { emitEvent: false });
      }
    });
  }

  private populateForm(): void {
    const complex = this.complex();
    if (complex) {
      this.isEditing = true;
      this.form.patchValue({
        name: complex.name,
        key: complex.key,
        location: complex.location || '',
        address: complex.address || '',
        sortOrder: complex.sortOrder,
        preponderance: complex.preponderance,
        description: complex.description || '',
        isActive: complex.isActive,
        logoImagePath: complex.logoImagePath || '',
        coverImagePath: complex.coverImagePath || '',
        layoutDiagramPath: complex.layoutDiagramPath || ''
      });
      this.form.get('key')?.disable();
    } else {
      this.isEditing = false;
      const nextOrder = this.facade.getNextSortOrder();
      const nextPreponderance = this.facade.getNextPreponderance();
      this.form.patchValue({
        sortOrder: nextOrder,
        preponderance: nextPreponderance,
        isActive: true
      });
    }
  }

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid || this.courtsLoading() || this.courtsLoadFailed() || this.courtEditorOpen() || this.saving() || this.savePending()) {
      return;
    }

    const expectedOrganizationId = this.activeOrg.activeOrganizationId();
    this.savePending.set(true);
    try {
      await this.persistDraft(expectedOrganizationId);
    } finally {
      this.savePending.set(false);
    }
  }

  private async persistDraft(expectedOrganizationId: string | null): Promise<void> {
    const formValue = this.form.getRawValue();

    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.complex()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.complex()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      return;
    }

    const payload = this.isEditing
      ? { ...this.complex(), ...formValue }
      : {
          ...formValue,
          cityId: '',
          cityName: '',
          sportsSupported: [],
          courtsCount: 0
        };

    // Upload pending logo file before persisting, then replace the preview URL
    // with the permanent storage URL.
    const logoFile = this.pendingLogoFile();
    if (logoFile) {
      const optimized = await this.imageOptimization.optimizeLogo(logoFile);
      const orgId = this.complex()?.organizationId ?? 'default';
      const entityId = (payload as Complex).id ?? 'new';
      const storedUrl = await this.fileStorage.upload(
        'complexes',
        `${orgId}/${entityId}/logo.webp`,
        optimized
      );
      (payload as Record<string, unknown>)['logoImagePath'] = storedUrl;
    }

    if (!expectedOrganizationId || this.activeOrg.activeOrganizationId() !== expectedOrganizationId) return;
    const success = await this.facade.saveComplexWithCourts(
      payload as Complex,
      this.courtDrafts().map(({ clientId, ...court }) => court),
      this.deletedCourtIds(),
      expectedOrganizationId
    );
    if (success) {
      this.pendingLogoFile.set(null);
      this.saved.emit();
    }
  }

  onCancel(): void {
    if (this.savePending() || this.saving()) return;
    this.cancelled.emit();
  }

  onActiveToggled(value: boolean): void {
    if (this.savePending() || this.saving()) return;
    this.form.get('isActive')!.setValue(value);
    this.form.markAsDirty();
  }

  onLogoChanged(event: { file: File; previewUrl: string }): void {
    if (this.savePending() || this.saving()) return;
    this.pendingLogoFile.set(event.file);
    // Store the preview URL so the field reflects the selection immediately.
    // The real URL will be set after uploading to storage on save.
    this.form.get('logoImagePath')?.setValue(event.previewUrl);
    this.form.markAsDirty();
  }

  onLogoRemoved(): void {
    if (this.savePending() || this.saving()) return;
    this.pendingLogoFile.set(null);
    this.form.get('logoImagePath')?.setValue('');
    this.form.markAsDirty();
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !this.submitted || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `admin.complexes.error.${controlName}Required`;
    }
    if (control.errors['pattern']) {
      return `admin.complexes.error.${controlName}Invalid`;
    }
    if (control.errors['min']) {
      return `admin.complexes.error.${controlName}Min`;
    }
    if (control.errors['maxlength']) {
      return `admin.complexes.error.${controlName}MaxLength`;
    }
    if (control.errors['keyExists']) {
      return 'admin.complexes.error.keyExists';
    }
    if (control.errors['nameExists']) {
      return 'admin.complexes.error.nameExists';
    }
    if (control.errors['sortOrderExists']) {
      return 'admin.complexes.error.sortOrderExists';
    }

    return 'admin.complexes.error.invalid';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return this.submitted && control?.invalid || false;
  }
}
