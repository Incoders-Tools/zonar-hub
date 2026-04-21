import { Component, inject, input, output, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { PhoneInputComponent } from '../../../../../shared/components/phone-input/phone-input.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { Tenant, PlanType } from '../../../../../core/models';

@Component({
  selector: 'app-tenant-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent, PhoneInputComponent, ActiveToggleComponent],
  templateUrl: './tenant-form-panel.component.html',
  styleUrl: './tenant-form-panel.component.scss'
})
export class TenantFormPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly subs: Subscription[] = [];

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

  private readonly formValid = signal(false);
  private readonly formDirty = signal(false);
  readonly canSubmit = computed(() => this.formValid() && this.formDirty() && !this.saving());

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

    this.formValid.set(this.form.valid);
    this.subs.push(
      this.form.statusChanges.subscribe(() => this.formValid.set(this.form.valid)),
      this.form.valueChanges.subscribe(() => this.formDirty.set(this.form.dirty))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
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
