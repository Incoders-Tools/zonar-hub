import { Component, inject, input, output, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { Organization, OrganizationType } from '../../../../../core/models';

@Component({
  selector: 'app-organization-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent, ActiveToggleComponent],
  templateUrl: './organization-form-panel.component.html',
  styleUrl: './organization-form-panel.component.scss'
})
export class OrganizationFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly organization = input<Organization | null>(null);
  readonly saving = input(false);
  readonly submitted = output<Partial<Organization>>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly isEditing = computed(() => this.organization() !== null);
  readonly titleKey = computed(() => this.isEditing() ? 'admin.organizations.form.edit' : 'admin.organizations.form.create');

  readonly typeOptions: { value: OrganizationType; labelKey: string }[] = [
    { value: 'empresa', labelKey: 'organization.type.empresa' },
    { value: 'circuito', labelKey: 'organization.type.circuito' },
    { value: 'academia', labelKey: 'organization.type.academia' },
    { value: 'operadora', labelKey: 'organization.type.operadora' },
    { value: 'marca', labelKey: 'organization.type.marca' },
    { value: 'unidad_operativa', labelKey: 'organization.type.unidadOperativa' }
  ];

  readonly canSubmit = computed(() => this.form?.valid && this.form?.dirty && !this.saving());

  ngOnInit(): void {
    const o = this.organization();
    this.form = this.fb.group({
      displayName: [o?.displayName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      legalName: [o?.legalName ?? '', [Validators.maxLength(150)]],
      description: [o?.description ?? '', [Validators.maxLength(500)]],
      type: [o?.type ?? 'circuito', [Validators.required]],
      isActive: [o?.isActive ?? true]
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      displayName: v.displayName,
      legalName: v.legalName || undefined,
      description: v.description || undefined,
      type: v.type,
      isActive: v.isActive
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
