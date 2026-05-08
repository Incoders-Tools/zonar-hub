import { Injectable } from '@angular/core';
import { AppLog } from '../../models/app-log.model';
import { AppLogRepository } from '../app-log.repository';

/**
 * Stub Api repository. The /api/admin/app-logs surface is not implemented yet,
 * so reads return an empty list and writes throw a translatable error code.
 */
@Injectable({ providedIn: 'root' })
export class ApiAppLogRepository implements AppLogRepository {
  async getAll(): Promise<AppLog[]> {
    return [];
  }

  async getById(_id: string): Promise<AppLog | undefined> {
    return undefined;
  }

  async markResolved(_id: string, _resolved: boolean): Promise<AppLog> {
    throw new Error('common.featureNotAvailable');
  }

  async cleanupOldLogs(_retentionDays: number): Promise<number> {
    return 0;
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async deleteMany(_ids: string[]): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
