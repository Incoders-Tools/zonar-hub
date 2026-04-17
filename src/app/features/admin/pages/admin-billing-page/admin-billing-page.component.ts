import { Component, inject, signal, computed } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ChatbotBubbleComponent } from '../../../../shared/components/chatbot-bubble/chatbot-bubble.component';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-admin-billing-page',
  standalone: true,
  imports: [TranslatePipe, AsyncButtonComponent, ChatbotBubbleComponent],
  templateUrl: './admin-billing-page.component.html',
  styleUrl: './admin-billing-page.component.scss'
})
export class AdminBillingPageComponent {
  readonly tenantContext = inject(TenantContextService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  readonly upgrading = signal(false);
  readonly trialDaysLeft = signal(14);
  readonly showUpgradeDialog = signal(false);
  readonly cardFlipped = signal(false);
  readonly showAddCardForm = signal(false);
  readonly addingCard = signal(false);

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

  addCard(): void {
    this.showAddCardForm.set(true);
  }

  async saveNewCard(): Promise<void> {
    this.addingCard.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.savedCard.set({
        brand: 'Visa',
        last4: String(Math.floor(1000 + Math.random() * 9000)),
        expMonth: new Date().getMonth() + 1,
        expYear: new Date().getFullYear() + 3
      });
      this.showAddCardForm.set(false);
      this.notifications.success('billing.toast.cardAdded');
    } catch {
      this.notifications.error('billing.toast.cardError');
    } finally {
      this.addingCard.set(false);
    }
  }

  cancelAddCard(): void {
    this.showAddCardForm.set(false);
  }

  contactSales(): void {
    const chatbot = document.querySelector('app-chatbot-bubble') as any;
    if (chatbot) {
      const component = chatbot.__ngContext__?.[chatbot.__ngContext__.length - 1];
      // Fallback: dispatch a custom event for the chatbot to handle
    }
    // Open chatbot via dispatching event
    window.dispatchEvent(new CustomEvent('zh-open-chatbot', {
      detail: { message: this.i18n.translate('billing.chatbot.upgradeMessage') }
    }));
  }
}
