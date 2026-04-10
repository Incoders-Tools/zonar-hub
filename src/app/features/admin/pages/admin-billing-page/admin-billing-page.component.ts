import { Component, inject, signal, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-billing-page',
  standalone: true,
  imports: [TranslatePipe, AsyncButtonComponent],
  templateUrl: './admin-billing-page.component.html',
  styleUrl: './admin-billing-page.component.scss'
})
export class AdminBillingPageComponent {
  readonly tenantContext = inject(TenantContextService);
  private readonly notifications = inject(NotificationService);

  readonly upgrading = signal(false);
  readonly trialDaysLeft = signal(14);
  readonly showUpgradeDialog = signal(false);
  readonly cardFlipped = signal(false);

  readonly savedCard = signal<{ brand: string; last4: string; expMonth: number; expYear: number } | null>({
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2027
  });

  readonly isTrialActive = computed(() => this.trialDaysLeft() > 0 && this.tenantContext.planType() !== 'enterprise');

  readonly planFeatures: Record<string, string[]> = {
    starter: [
      'billing.feature.tournaments2',
      'billing.feature.admin1',
      'billing.feature.complex1'
    ],
    pro: [
      'billing.feature.tournaments20',
      'billing.feature.admins5',
      'billing.feature.complexMultiple',
      'billing.feature.drawPlanner',
      'billing.feature.analytics'
    ],
    enterprise: [
      'billing.feature.tournamentsUnlimited',
      'billing.feature.admins50',
      'billing.feature.dedicatedServer',
      'billing.feature.dedicatedDB',
      'billing.feature.dedicatedAI',
      'billing.feature.sla',
      'billing.feature.branding'
    ]
  };

  readonly currentPlanFeatures = computed(() => {
    const plan = this.tenantContext.planType();
    return plan ? (this.planFeatures[plan] ?? []) : [];
  });

  async upgradePlan(targetPlan: string): Promise<void> {
    this.upgrading.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.notifications.success('billing.toast.upgradeSuccess');
      this.showUpgradeDialog.set(false);
    } catch {
      this.notifications.error('billing.toast.upgradeError');
    } finally {
      this.upgrading.set(false);
    }
  }

  toggleCardFlip(): void {
    this.cardFlipped.update(v => !v);
  }

  removeCard(): void {
    this.savedCard.set(null);
    this.notifications.success('billing.toast.cardRemoved');
  }
}
