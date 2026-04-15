import { Injectable } from '@angular/core';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '../../models/admin-user.model';
import { AdminUserRepository } from '../admin-user.repository';
import { MOCK_ADMIN_USERS } from '../../data/mock/mock-admin-users';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';

const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class MockAdminUserRepository implements AdminUserRepository {
  private users: AdminUser[] = [];
  private idCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    this.users = isDemoTenant() ? structuredClone(MOCK_ADMIN_USERS) : [];
    this.idCounter = this.users.length;
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<AdminUser[]> {
    this.ensureSeed();
    return this.delay(structuredClone(this.users));
  }

  async getById(id: string): Promise<AdminUser | undefined> {
    this.ensureSeed();
    const found = this.users.find(u => u.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(data: AdminUserCreatePayload): Promise<AdminUser> {
    this.ensureSeed();
    const now = new Date().toISOString();
    const newUser: AdminUser = {
      ...data,
      id: `usr${++this.idCounter}`,
      role: 'admin',
      isActive: true,
      is2FAEnabled: false,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(newUser);
    return this.delay(structuredClone(newUser));
  }

  async update(id: string, changes: AdminUserUpdatePayload): Promise<AdminUser> {
    this.ensureSeed();
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new Error(`AdminUser ${id} not found`);
    }
    this.users[idx] = {
      ...this.users[idx],
      ...changes,
      updatedAt: new Date().toISOString()
    };
    return this.delay(structuredClone(this.users[idx]));
  }

  async delete(id: string): Promise<void> {
    this.ensureSeed();
    this.users = this.users.filter(u => u.id !== id);
    return this.delay(undefined);
  }

  async deleteMany(ids: string[]): Promise<void> {
    this.ensureSeed();
    this.users = this.users.filter(u => !ids.includes(u.id));
    return this.delay(undefined);
  }
}
