import { AuditLog } from '../models/operational.model';

export interface AuditRepository {
  getAll(): Promise<AuditLog[]>;
  getById(id: string): Promise<AuditLog | undefined>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
