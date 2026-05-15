import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ZhCollectionViewComponent } from '../../../../shared/components/zh-collection-view/zh-collection-view.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { Plan } from '../../../../core/models';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActiveOrganizationService } from '../../../../core/services/active-organization.service';
import { PlanFacadeService, PlanFilters } from './plan-facade.service';
import { PlanFormPanelComponent } from './plan-form-panel/plan-form-panel.component';

interface PlanRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  priceLabel: string;
  maxTournaments: string;
  statusLabel: string;
  statusVariant: string;
  dedicatedLabel: string;
}

@Component({
  selector: 'app-admin-plans-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    ZhCollectionViewComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    PlanFormPanelComponent
  ],
  providers: [PlanFacadeService],
  templateUrl: './admin-plans-page.component.html',
  styleUrl: './admin-plans-page.component.scss'
})
export class AdminPlansPageComponent implements OnInit {
  readonly facade = inject(PlanFacadeService);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrganizationService);
  readonly isSystemAdmin = this.auth.isSystemAdmin;

  readonly currentOrgPlanId = computed(() => this.activeOrg.activeOrganization()?.planId ?? null);

  readonly activePlans = computed(() => this.facade.plans().filter(p => p.isActive));

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly editingPlan = signal<Plan | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.plans.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.plans.column.key', sortable: true },
    { key: 'priceLabel', labelKey: 'admin.plans.column.price', sortable: false },
    { key: 'maxTournaments', labelKey: 'admin.plans.column.maxTournaments', sortable: true },
    { key: 'dedicatedLabel', labelKey: 'admin.plans.column.dedicated', sortable: false },
    { key: 'statusLabel', labelKey: 'admin.plans.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly rowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.plans.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.plans.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.plans.status.active' },
        { value: 'false', labelKey: 'admin.plans.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<PlanRow[]>(() =>
    this.facade.filteredPlans().map(p => ({
      id: p.id,
      name: p.name,
      key: p.key,
      priceLabel: this.formatPrice(p),
      maxTournaments: p.maxTournaments === null ? '∞' : String(p.maxTournaments),
      dedicatedLabel: [
        p.dedicatedServer ? 'Server' : null,
        p.dedicatedDatabase ? 'DB' : null,
        p.dedicatedAI ? 'AI' : null
      ].filter(Boolean).join(', ') || '—',
      statusLabel: p.isActive ? 'admin.plans.status.active' : 'admin.plans.status.inactive',
      statusVariant: p.isActive ? 'active' : 'inactive'
    }))
  );

  ngOnInit(): void {
    this.facade.load();
  }

  private formatPrice(p: Plan): string {
    if (p.priceSingleUse !== null) return `$${p.priceSingleUse} (single)`;
    if (p.priceMonthly === 0) return 'Free';
    if (p.priceMonthly !== null) return `$${p.priceMonthly}/mo`;
    return '—';
  }

  formatCardPrice(p: Plan): { amount: string; suffix: string } {
    if (p.priceMonthly === 0) return { amount: '', suffix: 'admin.plans.cards.free' };
    if (p.priceSingleUse !== null) return { amount: `$${p.priceSingleUse}`, suffix: 'admin.plans.cards.perTournament' };
    if (p.priceMonthly !== null) return { amount: `$${p.priceMonthly}`, suffix: 'admin.plans.cards.perMonth' };
    return { amount: '', suffix: 'admin.plans.cards.contactSales' };
  }

  formatLimitValue(val: number | null): string {
    return val === null ? '∞' : String(val);
  }

  isCurrentPlan(plan: Plan): boolean {
    return plan.id === this.currentOrgPlanId();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    this.facade.applyFilters({
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    });
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.sort(event.key, event.direction);
  }

  onRowActionClicked(event: { action: string; row: PlanRow }): void {
    if (event.action === 'edit') this.openEdit(event.row);
    else if (event.action === 'delete') this.confirmDelete(event.row);
  }

  openCreate(): void {
    this.editingPlan.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: PlanRow): void {
    const plan = this.facade.plans().find(p => p.id === row.id);
    if (plan) {
      this.editingPlan.set(plan);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingPlan.set(null);
  }

  async onFormSubmitted(data: Partial<Plan>): Promise<void> {
    const existing = this.editingPlan();
    let success: boolean;
    if (existing) {
      success = await this.facade.updatePlan(existing.id, data);
    } else {
      success = await this.facade.createPlan(data as Omit<Plan, 'id'>);
    }
    if (success) this.closeFormPanel();
  }

  confirmDelete(row: PlanRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  executeDelete(): void {
    const id = this.deletingId();
    if (id) {
      this.facade.delete(id);
      this.showDeleteDialog.set(false);
      this.deletingId.set(null);
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }
}
