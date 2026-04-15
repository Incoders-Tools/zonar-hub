import { Injectable } from '@angular/core';
import { AppLog } from '../../models/app-log.model';
import { AppLogRepository } from '../app-log.repository';
import { MOCK_APP_LOGS } from '../../data/mock/mock-app-logs';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';

const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class MockAppLogRepository implements AppLogRepository {
  private logs: AppLog[] = [];
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    this.logs = isDemoTenant() ? structuredClone(MOCK_APP_LOGS) : [];
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<AppLog[]> {
    this.ensureSeed();
    return this.delay(structuredClone(this.logs));
  }

  async getById(id: string): Promise<AppLog | undefined> {
    this.ensureSeed();
    const found = this.logs.find(l => l.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async markResolved(id: string, resolved: boolean): Promise<AppLog> {
    this.ensureSeed();
    const idx = this.logs.findIndex(l => l.id === id);
    if (idx === -1) {
      throw new Error(`AppLog ${id} not found`);
    }
    this.logs[idx] = {
      ...this.logs[idx],
      resolved,
      resolvedAt: resolved ? new Date().toISOString() : undefined
    };
    return this.delay(structuredClone(this.logs[idx]));
  }

  async cleanupOldLogs(retentionDays: number): Promise<number> {
    this.ensureSeed();
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(l => l.createdAt > cutoffDate);
    const deletedCount = beforeCount - this.logs.length;
    return this.delay(deletedCount);
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
