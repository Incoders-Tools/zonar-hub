import { Injectable } from '@angular/core';
import { AuditLog } from '../../models/operational.model';
import { AuditRepository } from '../audit.repository';

@Injectable({ providedIn: 'root' })
export class ApiAuditRepository implements AuditRepository {
  async getAll(): Promise<AuditLog[]> {
    return [];
  }

  async getById(_id: string): Promise<AuditLog | undefined> {
    return undefined;
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  async deleteMany(_ids: string[]): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }
}
