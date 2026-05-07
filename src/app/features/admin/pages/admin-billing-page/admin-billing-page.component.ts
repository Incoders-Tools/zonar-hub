import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { PlansPricingComponent, PricingPlanKey } from '../../../../shared/components/plans-pricing/plans-pricing.component';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-admin-billing-page',
  standalone: true,
  imports: [TranslatePipe, AsyncButtonComponent, ReactiveFormsModule, PlansPricingComponent],
  templateUrl: './admin-billing-page.component.html',
  styleUrl: './admin-billing-page.component.scss'
})
export class AdminBillingPageComponent {
  readonly tenantContext = inject(TenantContextService);
  private readonly notifications = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  readonly upgrading = signal(false);
  readonly trialDaysLeft = signal(14);
  readonly showUpgradeDialog = signal(false);
  readonly cardFlipped = signal(false);
  readonly showAddCardForm = signal(false);
  readonly addingCard = signal(false);
  readonly newCardFocusField = signal<'number' | 'name' | 'expiry' | 'cvv' | null>(null);

  readonly cardForm: FormGroup = this.fb.group({
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
    cardHolder: ['', [Validators.required, Validators.minLength(3)]],
    cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
  });

  readonly formCardNumber = computed(() => {
    const raw = this.cardForm.get('cardNumber')?.value || '';
    if (!raw) return '•••• •••• •••• ••••';
    return raw.padEnd(19, '•').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  });

  readonly formCardHolder = computed(() => {
    return this.cardForm.get('cardHolder')?.value || 'YOUR NAME';
  });

  readonly formCardExpiry = computed(() => {
    return this.cardForm.get('cardExpiry')?.value || 'MM/YY';
  });

  readonly formCardCvv = computed(() => {
    const cvv = this.cardForm.get('cardCvv')?.value || '';
    return cvv ? '•'.repeat(cvv.length) : '•••';
  });

  readonly detectedBrand = computed(() => {
    const num = (this.cardForm.get('cardNumber')?.value || '').replace(/\s/g, '');
    if (!num) return '';
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6(?:011|5)/.test(num)) return 'discover';
    return '';
  });

  readonly brandLabel = computed(() => {
    const brand = this.detectedBrand();
    if (brand === 'visa') return 'VISA';
    if (brand === 'mastercard') return 'MASTERCARD';
    if (brand === 'amex') return 'AMEX';
    if (brand === 'discover') return 'DISCOVER';
    return '';
  });

  readonly savedCard = signal<{ brand: string; last4: string; expMonth: number; expYear: number } | null>({
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2027
  });

  readonly paymentMethods = signal<{ type: 'card' | 'paypal' | 'bank_transfer'; label: string; detail: string; isDefault: boolean }[]>([
    { type: 'card', label: 'Visa •••• 4242', detail: '12/2027', isDefault: true }
  ]);

  readonly selectedPaymentType = signal<'card' | 'paypal' | 'bank_transfer'>('card');

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

  /** Map the tenant's plan type to a key the shared pricing component understands. */
  readonly currentPlanKey = computed<PricingPlanKey | null>(() => {
    const plan = this.tenantContext.planType();
    if (plan === 'pro' || plan === 'enterprise') return plan;
    if (plan === 'starter' || plan === 'single_use') return 'starter';
    return null;
  });

  /** Default highlighted plan in the upgrade view: pro for starter, enterprise for pro. */
  readonly recommendedPlan = computed<PricingPlanKey>(() => {
    return this.currentPlanKey() === 'pro' ? 'enterprise' : 'pro';
  });

  onPlanSelected(plan: PricingPlanKey): void {
    if (plan === this.currentPlanKey()) return;
    if (plan === 'enterprise') {
      this.contactSales();
      return;
    }
    void this.upgradePlan(plan);
  }

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
    this.cardForm.reset();
    this.cardFlipped.set(false);
    this.newCardFocusField.set(null);
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 16);
    value = value.replace(/(.{4})/g, '$1 ').trim();
    this.cardForm.get('cardNumber')?.setValue(value, { emitEvent: false });
    input.value = value;
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    this.cardForm.get('cardExpiry')?.setValue(value, { emitEvent: false });
    input.value = value;
  }

  onCvvFocus(): void {
    this.cardFlipped.set(true);
    this.newCardFocusField.set('cvv');
  }

  onCvvBlur(): void {
    this.cardFlipped.set(false);
    this.newCardFocusField.set(null);
  }

  async saveNewCard(): Promise<void> {
    if (this.cardForm.invalid) {
      this.cardForm.markAllAsTouched();
      return;
    }
    this.addingCard.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const num = this.cardForm.get('cardNumber')!.value.replace(/\s/g, '');
      const expiry = this.cardForm.get('cardExpiry')!.value;
      const [expMonth, expYear] = expiry.split('/').map(Number);
      const brand = this.brandLabel() || 'Card';
      const last4 = num.slice(-4);
      this.savedCard.set({
        brand,
        last4,
        expMonth,
        expYear: 2000 + expYear
      });
      this.paymentMethods.update(methods => [
        ...methods,
        { type: 'card' as const, label: `${brand} •••• ${last4}`, detail: `${expMonth}/${2000 + expYear}`, isDefault: methods.length === 0 }
      ]);
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

  async connectPayPal(): Promise<void> {
    this.addingCard.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.paymentMethods.update(methods => [
        ...methods,
        { type: 'paypal', label: 'PayPal', detail: 'user@example.com', isDefault: false }
      ]);
      this.notifications.success('billing.toast.paypalConnected');
    } catch {
      this.notifications.error('billing.toast.cardError');
    } finally {
      this.addingCard.set(false);
    }
  }

  async addBankTransfer(): Promise<void> {
    this.addingCard.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.paymentMethods.update(methods => [
        ...methods,
        { type: 'bank_transfer', label: 'billing.bankTransfer', detail: '•••• 7890', isDefault: false }
      ]);
      this.notifications.success('billing.toast.bankAdded');
    } catch {
      this.notifications.error('billing.toast.cardError');
    } finally {
      this.addingCard.set(false);
    }
  }

  setDefaultPaymentMethod(index: number): void {
    this.paymentMethods.update(methods =>
      methods.map((m, i) => ({ ...m, isDefault: i === index }))
    );
    this.notifications.success('billing.toast.defaultChanged');
  }

  removePaymentMethod(index: number): void {
    this.paymentMethods.update(methods => methods.filter((_, i) => i !== index));
    this.notifications.success('billing.toast.cardRemoved');
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
