import { Component, inject, input, output, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { SportIconComponent } from '../../../../../shared/components/sport-icon/sport-icon.component';
import { Organization, OrganizationType, Sport } from '../../../../../core/models';
import {
  contactEmailValidator,
  httpUrlValidator,
  whatsappPhoneValidator
} from '../../../../../shared/validators/contact.validators';

interface OrgTypeOption {
  value: OrganizationType;
  labelKey: string;
  descKey: string;
  icon: string;
}
import { ApiSportRepository } from '../../../../../core/repositories/api/api-sport.repository';

export type OrganizationProfileLinkField =
  'websiteUrl' | 'instagramUrl' | 'facebookUrl' | 'tiktokUrl' | 'youtubeUrl' | 'whatsappPhone' | 'contactEmail';

interface ProfileLinkField {
  name: OrganizationProfileLinkField;
  inputType: 'url' | 'tel' | 'email';
  autocomplete: string;
}

/** Validator error → translation key, in priority order. */
const PROFILE_LINK_ERROR_KEYS: Record<string, string> = {
  httpUrlTooLong: 'admin.organizations.publicProfile.error.urlTooLong',
  httpUrl: 'admin.organizations.publicProfile.error.url',
  contactEmailTooLong: 'admin.organizations.publicProfile.error.emailTooLong',
  contactEmail: 'admin.organizations.publicProfile.error.email',
  whatsappPhone: 'admin.organizations.publicProfile.error.whatsappPhone'
};

export interface OrganizationFormSubmitData {
  displayName: string;
  legalName?: string;
  description?: string;
  type: OrganizationType;
  isActive: boolean;
  selectedSportIds: string[];
  /** Consent to appear in ZonarHub public sections. */
  publicProfileEnabled: boolean;
  /** Trimmed link values; blank means "no link" and the repository sends it as null. */
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  whatsappPhone: string;
  contactEmail: string;
}

@Component({
  selector: 'app-organization-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent, ActiveToggleComponent, SportIconComponent],
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

  readonly typeOptions: OrgTypeOption[] = [
    { value: 'estandar', labelKey: 'organization.type.estandar', descKey: 'organization.type.estandar.desc', icon: '🏢' },
    { value: 'circuito', labelKey: 'organization.type.circuito', descKey: 'organization.type.circuito.desc', icon: '🏆' },
    { value: 'academia', labelKey: 'organization.type.academia', descKey: 'organization.type.academia.desc', icon: '🎓' },
    { value: 'operadora', labelKey: 'organization.type.operadora', descKey: 'organization.type.operadora.desc', icon: '🎯' },
    { value: 'marca', labelKey: 'organization.type.marca', descKey: 'organization.type.marca.desc', icon: '🏷️' }
  ];

  readonly profileLinkFields: ProfileLinkField[] = [
    { name: 'websiteUrl', inputType: 'url', autocomplete: 'url' },
    { name: 'instagramUrl', inputType: 'url', autocomplete: 'off' },
    { name: 'facebookUrl', inputType: 'url', autocomplete: 'off' },
    { name: 'tiktokUrl', inputType: 'url', autocomplete: 'off' },
    { name: 'youtubeUrl', inputType: 'url', autocomplete: 'off' },
    { name: 'whatsappPhone', inputType: 'tel', autocomplete: 'tel' },
    { name: 'contactEmail', inputType: 'email', autocomplete: 'email' }
  ];

  selectOrgType(type: OrganizationType): void {
    this.form.get('type')!.setValue(type);
    this.form.markAsDirty();
    this.formDirty.set(true);
  }

  isOrgTypeSelected(type: OrganizationType): boolean {
    return this.form.get('type')!.value === type;
  }

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
      isActive: [o?.isActive ?? true],
      publicProfileEnabled: [o?.publicProfileEnabled ?? false],
      websiteUrl: [o?.websiteUrl ?? '', [httpUrlValidator()]],
      instagramUrl: [o?.instagramUrl ?? '', [httpUrlValidator()]],
      facebookUrl: [o?.facebookUrl ?? '', [httpUrlValidator()]],
      tiktokUrl: [o?.tiktokUrl ?? '', [httpUrlValidator()]],
      youtubeUrl: [o?.youtubeUrl ?? '', [httpUrlValidator()]],
      whatsappPhone: [o?.whatsappPhone ?? '', [whatsappPhoneValidator()]],
      contactEmail: [o?.contactEmail ?? '', [contactEmailValidator()]]
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
      selectedSportIds: [...this.selectedSportIds()],
      publicProfileEnabled: !!v.publicProfileEnabled,
      websiteUrl: (v.websiteUrl ?? '').trim(),
      instagramUrl: (v.instagramUrl ?? '').trim(),
      facebookUrl: (v.facebookUrl ?? '').trim(),
      tiktokUrl: (v.tiktokUrl ?? '').trim(),
      youtubeUrl: (v.youtubeUrl ?? '').trim(),
      whatsappPhone: (v.whatsappPhone ?? '').trim(),
      contactEmail: (v.contactEmail ?? '').trim()
    });
  }

  onPublicProfileToggled(value: boolean): void {
    this.form.get('publicProfileEnabled')!.setValue(value);
    this.form.markAsDirty();
  }

  /** Translation key of the first error of a link field, once the operator has interacted with it. */
  profileLinkErrorKey(name: OrganizationProfileLinkField): string | null {
    const control = this.form.get(name);
    if (!control?.errors || !(control.touched || control.dirty)) return null;
    const errorKey = Object.keys(PROFILE_LINK_ERROR_KEYS).find(key => control.hasError(key));
    return errorKey ? PROFILE_LINK_ERROR_KEYS[errorKey] : null;
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
