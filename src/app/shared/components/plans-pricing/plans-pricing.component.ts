import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type PricingPlanKey = 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type PricingMode = 'public' | 'authenticated';

interface PricingCard {
  key: PricingPlanKey;
  nameKey: string;
  badgeKey?: string;
  priceMonthlyKey: string;
  priceAnnualKey?: string;
  scopeKeys: string[];
  featureKeys: string[];
  ctaPublicKey: string;
  ctaAuthKey: string;
  ctaRoute: string;
  ctaContact?: boolean;
  highlighted?: boolean;
}

const PLANS: PricingCard[] = [
  {
    key: 'starter',
    nameKey: 'home.pricing.starter.name',
    priceMonthlyKey: 'home.pricing.starter.price',
    priceAnnualKey: 'home.pricing.starter.priceAnnual',
    scopeKeys: ['home.pricing.starter.scope1', 'home.pricing.starter.scope2', 'home.pricing.starter.scope3'],
    featureKeys: [
      'home.pricing.starter.feature1',
      'home.pricing.starter.feature2',
      'home.pricing.starter.feature3',
      'home.pricing.starter.feature4'
    ],
    ctaPublicKey: 'home.pricing.cta.starter',
    ctaAuthKey: 'plans.cta.select',
    ctaRoute: '/register'
  },
  {
    key: 'pro',
    nameKey: 'home.pricing.pro.name',
    badgeKey: 'home.pricing.pro.badge',
    priceMonthlyKey: 'home.pricing.pro.price',
    priceAnnualKey: 'home.pricing.pro.priceAnnual',
    scopeKeys: ['home.pricing.pro.scope1', 'home.pricing.pro.scope2'],
    featureKeys: [
      'home.pricing.pro.feature1',
      'home.pricing.pro.feature2',
      'home.pricing.pro.feature3',
      'home.pricing.pro.feature4',
      'home.pricing.pro.feature5',
      'home.pricing.pro.feature6'
    ],
    ctaPublicKey: 'home.pricing.cta.pro',
    ctaAuthKey: 'plans.cta.upgrade',
    ctaRoute: '/register',
    highlighted: true
  },
  {
    key: 'enterprise',
    nameKey: 'home.pricing.enterprise.name',
    priceMonthlyKey: 'home.pricing.enterprise.price',
    scopeKeys: [
      'home.pricing.enterprise.scope1',
      'home.pricing.enterprise.scope2',
      'home.pricing.enterprise.scope3',
      'home.pricing.enterprise.scope4'
    ],
    featureKeys: [
      'home.pricing.enterprise.feature1',
      'home.pricing.enterprise.feature2',
      'home.pricing.enterprise.feature3',
      'home.pricing.enterprise.feature4',
      'home.pricing.enterprise.feature5',
      'home.pricing.enterprise.feature6',
      'home.pricing.enterprise.feature7',
      'home.pricing.enterprise.feature8',
      'home.pricing.enterprise.feature9',
      'home.pricing.enterprise.feature10',
      'home.pricing.enterprise.feature11',
      'home.pricing.enterprise.feature12'
    ],
    ctaPublicKey: 'home.pricing.cta.enterprise',
    ctaAuthKey: 'plans.cta.contactSales',
    ctaRoute: '/contact',
    ctaContact: true
  }
];

@Component({
  selector: 'app-plans-pricing',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './plans-pricing.component.html',
  styleUrl: './plans-pricing.component.scss'
})
export class PlansPricingComponent {
  /** 'public' surfaces register links; 'authenticated' surfaces select/upgrade. */
  readonly mode = input<PricingMode>('public');

  /** Render the monthly/annual toggle (default true). */
  readonly showToggle = input(true);

  /** Default selection (which card looks primary). */
  readonly initialSelection = input<PricingPlanKey>('pro');

  /** Optional plan key the tenant is already on; used to mark "current plan". */
  readonly currentPlanKey = input<PricingPlanKey | null>(null);

  /** Disable interactive selection (read-only display). */
  readonly readOnly = input(false);

  readonly planSelected = output<PricingPlanKey>();
  readonly billingCycleChanged = output<BillingCycle>();

  readonly plans = PLANS;
  readonly billingCycle = signal<BillingCycle>('monthly');

  private readonly selection = signal<PricingPlanKey | null>(null);
  readonly selectedPlan = computed<PricingPlanKey>(() => this.selection() ?? this.initialSelection());

  selectPlan(plan: PricingPlanKey): void {
    if (this.readOnly()) return;
    this.selection.set(plan);
    this.planSelected.emit(plan);
  }

  setBillingCycle(cycle: BillingCycle): void {
    this.billingCycle.set(cycle);
    this.billingCycleChanged.emit(cycle);
  }

  toggleBillingCycle(): void {
    this.setBillingCycle(this.billingCycle() === 'monthly' ? 'annual' : 'monthly');
  }

  ctaLabelKey(card: PricingCard): string {
    return this.mode() === 'public' ? card.ctaPublicKey : card.ctaAuthKey;
  }

  ctaLink(card: PricingCard): string {
    return card.ctaRoute;
  }

  isCurrent(card: PricingCard): boolean {
    return this.currentPlanKey() === card.key;
  }
}
