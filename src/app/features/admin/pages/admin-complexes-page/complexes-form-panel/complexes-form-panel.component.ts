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
import { Complex } from '../../../../../core/models';
import { ComplexesFacadeService } from '../complexes-facade.service';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { FILE_STORAGE_REPOSITORY } from '../../../../../core/repositories/file-storage.repository';
import { ImageOptimizationService } from '../../../../../core/services/image-optimization.service';

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
    ImageUploadComponent
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
  private readonly fileStorage = inject(FILE_STORAGE_REPOSITORY);
  private readonly imageOptimization = inject(ImageOptimizationService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly complex = input<Complex | null>(null);
  readonly saving = input(false);

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

    if (!this.form.valid) {
      return;
    }

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
      this.pendingLogoFile.set(null);
    }

    const success = await this.facade.saveComplex(payload);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onLogoChanged(event: { file: File; previewUrl: string }): void {
    this.pendingLogoFile.set(event.file);
    // Store the preview URL so the field reflects the selection immediately.
    // The real URL will be set after uploading to storage on save.
    this.form.get('logoImagePath')?.setValue(event.previewUrl);
    this.form.markAsDirty();
  }

  onLogoRemoved(): void {
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
