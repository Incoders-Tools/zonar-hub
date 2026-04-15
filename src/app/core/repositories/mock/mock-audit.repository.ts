import { Injectable } from '@angular/core';
import { AuditLog } from '../../models/operational.model';
import { AuditRepository } from '../audit.repository';
import { MOCK_AUDIT_LOGS } from '../../data/mock/mock-audit';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';

const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class MockAuditRepository implements AuditRepository {
  private logs: AuditLog[] = [];
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    this.logs = isDemoTenant() ? structuredClone(MOCK_AUDIT_LOGS) : [];
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<AuditLog[]> {
    this.ensureSeed();
    return this.delay(structuredClone(this.logs));
  }

  async getById(id: string): Promise<AuditLog | undefined> {
    this.ensureSeed();
    const found = this.logs.find(l => l.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async delete(id: string): Promise<void> {
    this.ensureSeed();
    this.logs = this.logs.filter(l => l.id !== id);
    return this.delay(undefined);
  }

  async deleteMany(ids: string[]): Promise<void> {
    this.ensureSeed();
    this.logs = this.logs.filter(l => !ids.includes(l.id));
    return this.delay(undefined);
  }
}
