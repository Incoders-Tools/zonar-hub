import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { AuthService } from '../../../../../core/auth/auth.service';
import { Complex, ComplexServiceAssignment, ComplexSocialNetwork } from '../../../../../core/models';
import { ComplexesFacadeService } from '../complexes-facade.service';
import { MockComplexServiceRepository } from '../../../../../core/repositories/mock/mock-complex-service.repository';
import { MockSocialNetworkRepository } from '../../../../../core/repositories/mock/mock-social-network.repository';
import { ComplexService, SocialNetwork } from '../../../../../core/models';

type FormTab = 'datos' | 'servicios' | 'redes';

interface ServiceRow {
  serviceId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface NetworkRow {
  socialNetworkId: string;
  name: string;
  isActive: boolean;
  profileUrl: string;
}

@Component({
  selector: 'app-complexes-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatIcon,
    DragDropModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent
  ],
  templateUrl: './complexes-form-dialog.component.html',
  styleUrl: './complexes-form-dialog.component.scss',
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
export class ComplexesFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ComplexesFacadeService);
  private readonly auth = inject(AuthService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;
  private readonly complexServiceRepo = inject(MockComplexServiceRepository);
  private readonly socialNetworkRepo = inject(MockSocialNetworkRepository);

  readonly complex = input<Complex | null>(null);
  readonly saving = input(false);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  isEditing = false;
  submitted = false;

  readonly activeFormTab = signal<FormTab>('datos');

  // Services tab
  readonly allServices = signal<ComplexService[]>([]);
  readonly serviceRows = signal<ServiceRow[]>([]);

  // Social networks tab
  readonly allNetworks = signal<SocialNetwork[]>([]);
  readonly networkRows = signal<NetworkRow[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.populateForm();
    this.loadServicesTab();
    this.loadNetworksTab();
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
      // Optional fields (collapsible)
      logoImagePath: [''],
      coverImagePath: [''],
      layoutDiagramPath: ['']
    });

    // Auto-generate key from name
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.isEditing && name) {
        const key = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
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
      // Disable key field when editing
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

  private async loadServicesTab(): Promise<void> {
    const complex = this.complex();
    const services = await this.complexServiceRepo.getAll();
    this.allServices.set(services);

    if (complex) {
      const assignments = await this.facade.loadServiceAssignments(complex.id).then(() => this.facade.serviceAssignments());
      this.serviceRows.set(
        services.map(s => {
          const assignment = assignments.find(a => a.serviceId === s.id);
          return {
            serviceId: s.id,
            name: s.name,
            isActive: assignment?.isActive ?? false,
            sortOrder: assignment?.sortOrder ?? 0
          };
        })
      );
    } else {
      this.serviceRows.set(
        services.map(s => ({
          serviceId: s.id,
          name: s.name,
          isActive: false,
          sortOrder: 0
        }))
      );
    }
  }

  private async loadNetworksTab(): Promise<void> {
    const complex = this.complex();
    const networks = await this.socialNetworkRepo.getAll();
    this.allNetworks.set(networks);

    if (complex) {
      const existing = await this.facade.loadSocialNetworks(complex.id).then(() => this.facade.socialNetworks());
      this.networkRows.set(
        networks.map(n => {
          const assignment = existing.find(e => e.socialNetworkId === n.id);
          return {
            socialNetworkId: n.id,
            name: n.name,
            isActive: assignment?.isActive ?? false,
            profileUrl: assignment?.profileUrl ?? ''
          };
        })
      );
    } else {
      this.networkRows.set(
        networks.map(n => ({
          socialNetworkId: n.id,
          name: n.name,
          isActive: false,
          profileUrl: ''
        }))
      );
    }
  }

  setActiveTab(tab: FormTab): void {
    this.activeFormTab.set(tab);
  }

  // --- Service rows ---

  toggleServiceActive(index: number): void {
    this.serviceRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], isActive: !updated[index].isActive };
      return updated;
    });
  }

  updateServiceSortOrder(index: number, value: number): void {
    this.serviceRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], sortOrder: value };
      return updated;
    });
  }

  onServiceDrop(event: CdkDragDrop<ServiceRow[]>): void {
    this.serviceRows.update(rows => {
      const updated = [...rows];
      moveItemInArray(updated, event.previousIndex, event.currentIndex);
      return updated.map((row, i) => ({ ...row, sortOrder: i + 1 }));
    });
  }

  // --- Network rows ---

  toggleNetworkActive(index: number): void {
    this.networkRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], isActive: !updated[index].isActive };
      return updated;
    });
  }

  updateNetworkUrl(index: number, url: string): void {
    this.networkRows.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], profileUrl: url };
      return updated;
    });
  }

  onNetworkDrop(event: CdkDragDrop<NetworkRow[]>): void {
    this.networkRows.update(rows => {
      const updated = [...rows];
      moveItemInArray(updated, event.previousIndex, event.currentIndex);
      return updated;
    });
  }

  // --- Save ---

  async onSave(): Promise<void> {
    this.submitted = true;

    if (!this.form.valid) {
      this.activeFormTab.set('datos');
      return;
    }

    const formValue = this.form.getRawValue();

    // Validate uniqueness
    if (!this.isEditing) {
      const keyExists = await this.facade.checkKeyExists(formValue.key);
      if (keyExists) {
        this.form.get('key')?.setErrors({ keyExists: true });
        this.activeFormTab.set('datos');
        return;
      }
    }

    const nameExists = await this.facade.checkNameExists(formValue.name, this.complex()?.id);
    if (nameExists) {
      this.form.get('name')?.setErrors({ nameExists: true });
      this.activeFormTab.set('datos');
      return;
    }

    const sortOrderExists = await this.facade.checkSortOrderExists(
      formValue.sortOrder ? Number(formValue.sortOrder) : null,
      this.complex()?.id
    );
    if (sortOrderExists) {
      this.form.get('sortOrder')?.setErrors({ sortOrderExists: true });
      this.activeFormTab.set('datos');
      return;
    }

    // Build the payload
    const payload = this.isEditing
      ? { ...this.complex(), ...formValue }
      : {
          ...formValue,
          cityId: '',
          cityName: '',
          sportsSupported: [],
          courtsCount: 0
        };

    const success = await this.facade.saveComplex(payload);

    if (success) {
      // Determine complex ID for saving assignments
      const complexId = this.isEditing
        ? this.complex()!.id
        : this.facade.entities().at(-1)?.id;

      if (complexId) {
        // Save service assignments
        const activeAssignments: ComplexServiceAssignment[] = this.serviceRows()
          .filter(r => r.isActive)
          .map(r => ({
            serviceId: r.serviceId,
            isActive: r.isActive,
            sortOrder: r.sortOrder
          }));
        await this.facade.saveServiceAssignments(complexId, activeAssignments);

        // Save social networks
        const activeNetworks: ComplexSocialNetwork[] = this.networkRows()
          .filter(r => r.isActive && r.profileUrl.trim())
          .map(r => ({
            socialNetworkId: r.socialNetworkId,
            profileUrl: r.profileUrl,
            isActive: r.isActive
          }));
        await this.facade.saveSocialNetworks(complexId, activeNetworks);
      }

      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
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
