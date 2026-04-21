import { Component, inject, input, output, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { Plan, PlanType } from '../../../../../core/models';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';

@Component({
  selector: 'app-plan-form-panel',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AsyncButtonComponent, FormShellComponent, ActiveToggleComponent],
  templateUrl: './plan-form-panel.component.html',
  styleUrl: './plan-form-panel.component.scss'
})
export class PlanFormPanelComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly subs: Subscription[] = [];

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

  private readonly formValid = signal(false);
  private readonly formDirty = signal(false);
  readonly canSubmit = computed(() => this.formValid() && this.formDirty() && !this.saving());

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

    this.formValid.set(this.form.valid);
    this.subs.push(
      this.form.statusChanges.subscribe(() => this.formValid.set(this.form.valid)),
      this.form.valueChanges.subscribe(() => this.formDirty.set(this.form.dirty))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
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
