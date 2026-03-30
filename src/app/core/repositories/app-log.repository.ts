import { AppLog } from '../models/app-log.model';

export interface AppLogRepository {
  getAll(): Promise<AppLog[]>;
  getById(id: string): Promise<AppLog | undefined>;
  markResolved(id: string, resolved: boolean): Promise<AppLog>;
  cleanupOldLogs(retentionDays: number): Promise<number>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
