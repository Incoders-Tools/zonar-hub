import { Injectable } from '@angular/core';
import { Plan } from '../../models';
import { PlanRepository } from '../plan.repository';

@Injectable({ providedIn: 'root' })
export class ApiPlanRepository extends PlanRepository {
  async getAll(): Promise<Plan[]> {
    return [];
  }

  async getById(id: string): Promise<Plan> {
    throw new Error(`Plan ${id} not found`);
  }

  async create(_data: Omit<Plan, 'id'>): Promise<Plan> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _data: Partial<Omit<Plan, 'id'>>): Promise<Plan> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
