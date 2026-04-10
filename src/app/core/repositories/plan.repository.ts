import { Plan } from '../models';

export abstract class PlanRepository {
  abstract getAll(): Promise<Plan[]>;
  abstract getById(id: string): Promise<Plan>;
  abstract create(data: Omit<Plan, 'id'>): Promise<Plan>;
  abstract update(id: string, data: Partial<Omit<Plan, 'id'>>): Promise<Plan>;
  abstract delete(id: string): Promise<void>;
}
