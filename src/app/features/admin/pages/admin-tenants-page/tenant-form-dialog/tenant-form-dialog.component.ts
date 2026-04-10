import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { Tenant, PlanType } from '../../../../../core/models';

@Component({
  selector: 'app-tenant-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent],
  templateUrl: './tenant-form-dialog.component.html',
  styleUrl: './tenant-form-dialog.component.scss'
})
export class TenantFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly tenant = input<Tenant | null>(null);
  readonly saving = input(false);
  readonly submitted = output<Partial<Tenant>>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly isEditing = computed(() => this.tenant() !== null);
  readonly titleKey = computed(() => this.isEditing() ? 'admin.tenants.form.edit' : 'admin.tenants.form.create');

  readonly planOptions: { value: PlanType; labelKey: string }[] = [
    { value: 'starter', labelKey: 'admin.tenants.plan.starter' },
    { value: 'pro', labelKey: 'admin.tenants.plan.pro' },
    { value: 'enterprise', labelKey: 'admin.tenants.plan.enterprise' },
    { value: 'single_use', labelKey: 'admin.tenants.plan.singleUse' }
  ];

  readonly canSubmit = computed(() => this.form?.valid && this.form?.dirty && !this.saving());

  ngOnInit(): void {
    const t = this.tenant();
    this.form = this.fb.group({
      name: [t?.name ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      key: [t?.key ?? '', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      contactEmail: [t?.contactEmail ?? '', [Validators.required, Validators.email]],
      contactPhone: [t?.contactPhone ?? ''],
      planType: [t?.planType ?? 'starter', [Validators.required]],
      isActive: [t?.isActive ?? true]
    });
  }

  onNameBlur(): void {
    const name = this.form.get('name')?.value;
    const keyCtrl = this.form.get('key');
    if (name && !this.isEditing() && !keyCtrl?.dirty) {
      keyCtrl?.setValue(
        name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      );
    }
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name,
      key: v.key,
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone || undefined,
      planId: '',
      planType: v.planType,
      isActive: v.isActive
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
