import { Injectable } from '@angular/core';
import { AuditLog } from '../../models/operational.model';
import { AuditRepository } from '../audit.repository';
import { MOCK_AUDIT_LOGS } from '../../data/mock/mock-audit';

const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class MockAuditRepository implements AuditRepository {
  private logs: AuditLog[] = structuredClone(MOCK_AUDIT_LOGS);

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<AuditLog[]> {
    return this.delay(structuredClone(this.logs));
  }

  async getById(id: string): Promise<AuditLog | undefined> {
    const found = this.logs.find(l => l.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async delete(id: string): Promise<void> {
    this.logs = this.logs.filter(l => l.id !== id);
    return this.delay(undefined);
  }

  async deleteMany(ids: string[]): Promise<void> {
    this.logs = this.logs.filter(l => !ids.includes(l.id));
    return this.delay(undefined);
  }
}
