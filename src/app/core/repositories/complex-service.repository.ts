import { ComplexService } from '../models';

export interface ComplexServiceRepository {
  getAll(): Promise<ComplexService[]>;
  getById(id: string): Promise<ComplexService | undefined>;
  create(service: Omit<ComplexService, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplexService>;
  update(id: string, service: Partial<ComplexService>): Promise<ComplexService>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
