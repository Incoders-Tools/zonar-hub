import { Injectable } from '@angular/core';
import { Plan, PlanType } from '../../models';
import { PlanRepository } from '../plan.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'plans';

interface PlanStorageState { data: Plan[]; nextId: number; }

const SEED_PLANS: Plan[] = [
    {
      id: 'plan-1',
      name: 'Starter',
      key: 'starter',
      priceMonthly: 0,
      priceAnnual: 0,
      priceSingleUse: null,
      maxTournaments: 2,
      maxAdmins: 1,
      maxComplexes: 1,
      maxCourts: 4,
      features: [
        'plans.feature.basicTournaments',
        'plans.feature.basicRegistrations',
        'plans.feature.publicDraw'
      ],
      dedicatedServer: false,
      dedicatedDatabase: false,
      dedicatedAI: false,
      isActive: true
    },
    {
      id: 'plan-2',
      name: 'Pro',
      key: 'pro',
      priceMonthly: 49,
      priceAnnual: 468,
      priceSingleUse: null,
      maxTournaments: 20,
      maxAdmins: 5,
      maxComplexes: 3,
      maxCourts: 20,
      features: [
        'plans.feature.basicTournaments',
        'plans.feature.basicRegistrations',
        'plans.feature.publicDraw',
        'plans.feature.customBranding',
        'plans.feature.advancedStats',
        'plans.feature.emailNotifications'
      ],
      dedicatedServer: false,
      dedicatedDatabase: false,
      dedicatedAI: false,
      isActive: true
    },
    {
      id: 'plan-3',
      name: 'Enterprise',
      key: 'enterprise',
      priceMonthly: 199,
      priceAnnual: 1908,
      priceSingleUse: null,
      maxTournaments: null,
      maxAdmins: 50,
      maxComplexes: 20,
      maxCourts: 100,
      features: [
        'plans.feature.basicTournaments',
        'plans.feature.basicRegistrations',
        'plans.feature.publicDraw',
        'plans.feature.customBranding',
        'plans.feature.advancedStats',
        'plans.feature.emailNotifications',
        'plans.feature.dedicatedServer',
        'plans.feature.dedicatedDatabase',
        'plans.feature.aiAssistant',
        'plans.feature.prioritySupport',
        'plans.feature.slaGuarantee'
      ],
      dedicatedServer: true,
      dedicatedDatabase: true,
      dedicatedAI: true,
      isActive: true
    },
    {
      id: 'plan-4',
      name: 'Single Use',
      key: 'single_use',
      priceMonthly: null,
      priceAnnual: null,
      priceSingleUse: 50,
      maxTournaments: 1,
      maxAdmins: 2,
      maxComplexes: 1,
      maxCourts: 8,
      features: [
        'plans.feature.basicTournaments',
        'plans.feature.basicRegistrations',
        'plans.feature.publicDraw',
        'plans.feature.singleUseBadge'
      ],
      dedicatedServer: false,
      dedicatedDatabase: false,
      dedicatedAI: false,
      isActive: true
    }
  ];

@Injectable({ providedIn: 'root' })
export class MockPlanRepository extends PlanRepository {
  private plans: Plan[];
  private nextId: number;

  constructor() {
    super();
    const stored = loadFromStorage<PlanStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.plans = stored.data;
      this.nextId = stored.nextId;
    } else {
      this.plans = structuredClone(SEED_PLANS);
      this.nextId = 5;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.plans, nextId: this.nextId });
  }

  async getAll(): Promise<Plan[]> {
    await this.delay();
    return JSON.parse(JSON.stringify(this.plans));
  }

  async getById(id: string): Promise<Plan> {
    await this.delay();
    const plan = this.plans.find(p => p.id === id);
    if (!plan) throw new Error(`Plan ${id} not found`);
    return JSON.parse(JSON.stringify(plan));
  }

  async create(data: Omit<Plan, 'id'>): Promise<Plan> {
    await this.delay();
    if (this.plans.some(p => p.key === data.key)) {
      throw new Error(`Plan key "${data.key}" already exists`);
    }
    const plan: Plan = { ...data, id: `plan-${this.nextId++}` };
    this.plans.push(plan);
    this.persist();
    return JSON.parse(JSON.stringify(plan));
  }

  async update(id: string, data: Partial<Omit<Plan, 'id'>>): Promise<Plan> {
    await this.delay();
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Plan ${id} not found`);
    this.plans[idx] = { ...this.plans[idx], ...data };
    this.persist();
    return JSON.parse(JSON.stringify(this.plans[idx]));
  }

  async delete(id: string): Promise<void> {
    await this.delay();
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Plan ${id} not found`);
    this.plans.splice(idx, 1);
    this.persist();
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 400));
  }
}
