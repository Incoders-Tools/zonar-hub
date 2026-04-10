import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { Plan, PlanType } from '../../../../../core/models';

@Component({
  selector: 'app-plan-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent],
  templateUrl: './plan-form-dialog.component.html',
  styleUrl: './plan-form-dialog.component.scss'
})
export class PlanFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly plan = input<Plan | null>(null);
  readonly saving = input(false);
  readonly submitted = output<Partial<Plan>>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly isEditing = computed(() => this.plan() !== null);
  readonly titleKey = computed(() => this.isEditing() ? 'admin.plans.form.edit' : 'admin.plans.form.create');

  readonly keyOptions: { value: PlanType; labelKey: string }[] = [
    { value: 'starter', labelKey: 'admin.plans.key.starter' },
    { value: 'pro', labelKey: 'admin.plans.key.pro' },
    { value: 'enterprise', labelKey: 'admin.plans.key.enterprise' },
    { value: 'single_use', labelKey: 'admin.plans.key.singleUse' }
  ];

  readonly canSubmit = computed(() => this.form?.valid && this.form?.dirty && !this.saving());

  ngOnInit(): void {
    const p = this.plan();
    this.form = this.fb.group({
      name: [p?.name ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      key: [p?.key ?? 'starter', [Validators.required]],
      priceMonthly: [p?.priceMonthly ?? 0],
      priceAnnual: [p?.priceAnnual ?? 0],
      priceSingleUse: [p?.priceSingleUse ?? null],
      maxTournaments: [p?.maxTournaments ?? 1],
      maxAdmins: [p?.maxAdmins ?? 1, [Validators.required, Validators.min(1)]],
      maxComplexes: [p?.maxComplexes ?? 1, [Validators.required, Validators.min(1)]],
      maxCourts: [p?.maxCourts ?? 4, [Validators.required, Validators.min(1)]],
      dedicatedServer: [p?.dedicatedServer ?? false],
      dedicatedDatabase: [p?.dedicatedDatabase ?? false],
      dedicatedAI: [p?.dedicatedAI ?? false],
      isActive: [p?.isActive ?? true]
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name,
      key: v.key,
      priceMonthly: v.priceMonthly,
      priceAnnual: v.priceAnnual,
      priceSingleUse: v.priceSingleUse,
      maxTournaments: v.maxTournaments,
      maxAdmins: v.maxAdmins,
      maxComplexes: v.maxComplexes,
      maxCourts: v.maxCourts,
      features: [],
      dedicatedServer: v.dedicatedServer,
      dedicatedDatabase: v.dedicatedDatabase,
      dedicatedAI: v.dedicatedAI,
      isActive: v.isActive
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
