import { Component, inject, input, output, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { Organization, OrganizationType, Sport } from '../../../../../core/models';
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';

export interface OrganizationFormSubmitData {
  displayName: string;
  legalName?: string;
  description?: string;
  type: OrganizationType;
  isActive: boolean;
  selectedSportIds: string[];
}

@Component({
  selector: 'app-organization-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent, ActiveToggleComponent],
  templateUrl: './organization-form-panel.component.html',
  styleUrl: './organization-form-panel.component.scss'
})
export class OrganizationFormPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly sportRepo = inject(ApiSportRepository);
  private readonly subs: Subscription[] = [];

  readonly organization = input<Organization | null>(null);
  readonly saving = input(false);
  readonly submitted = output<OrganizationFormSubmitData>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly availableSports = signal<Sport[]>([]);
  readonly selectedSportIds = signal<Set<string>>(new Set());
  readonly isEditing = computed(() => this.organization() !== null);
  readonly titleKey = computed(() => this.isEditing() ? 'admin.organizations.form.edit' : 'admin.organizations.form.create');

  readonly typeOptions: { value: OrganizationType; labelKey: string }[] = [
    { value: 'estandar', labelKey: 'organization.type.estandar' },
    { value: 'circuito', labelKey: 'organization.type.circuito' },
    { value: 'academia', labelKey: 'organization.type.academia' },
    { value: 'operadora', labelKey: 'organization.type.operadora' },
    { value: 'marca', labelKey: 'organization.type.marca' }
  ];

  /** Track form state via signals so computed can react */
  private readonly formValid = signal(false);
  private readonly formDirty = signal(false);
  private readonly sportsDirty = signal(false);
  readonly hasSportSelection = computed(() => this.selectedSportIds().size > 0);

  readonly canSubmit = computed(() =>
    this.formValid()
    && this.hasSportSelection()
    && !this.saving()
    && (!this.isEditing() || this.formDirty() || this.sportsDirty())
  );

  ngOnInit(): void {
    const o = this.organization();
    this.form = this.fb.group({
      displayName: [o?.displayName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      legalName: [o?.legalName ?? '', [Validators.maxLength(150)]],
      description: [o?.description ?? '', [Validators.maxLength(500)]],
      type: [o?.type ?? 'circuito', [Validators.required]],
      isActive: [o?.isActive ?? true]
    });

    this.formValid.set(this.form.valid);

    this.subs.push(
      this.form.statusChanges.subscribe(() => this.formValid.set(this.form.valid)),
      this.form.valueChanges.subscribe(() => this.formDirty.set(this.form.dirty))
    );

    void this.loadSports();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onSubmit(): void {
    if (!this.form.valid || this.selectedSportIds().size === 0) return;

    const v = this.form.getRawValue();
    this.submitted.emit({
      displayName: v.displayName,
      legalName: v.legalName || undefined,
      description: v.description || undefined,
      type: v.type,
      isActive: v.isActive,
      selectedSportIds: [...this.selectedSportIds()]
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  toggleSport(sportId: string): void {
    const current = new Set(this.selectedSportIds());
    if (current.has(sportId)) {
      current.delete(sportId);
    } else {
      current.add(sportId);
    }

    this.selectedSportIds.set(current);
    this.sportsDirty.set(true);
  }

  isSportSelected(sportId: string): boolean {
    return this.selectedSportIds().has(sportId);
  }

  private async loadSports(): Promise<void> {
    try {
      const org = this.organization();

      const allSports = await this.sportRepo.getAll();
      this.availableSports.set(allSports.filter(sport => sport.isActive));

      if (!org) {
        this.selectedSportIds.set(new Set());
        this.sportsDirty.set(false);
        return;
      }

      const enabled = await this.sportRepo.getForOrganization(org.id);
      this.selectedSportIds.set(new Set(
        enabled
          .filter(sport => sport.isActive)
          .map(sport => sport.id)
      ));
      this.sportsDirty.set(false);
    } catch {
      this.availableSports.set([]);
      this.selectedSportIds.set(new Set());
      this.sportsDirty.set(false);
    }
  }
}
