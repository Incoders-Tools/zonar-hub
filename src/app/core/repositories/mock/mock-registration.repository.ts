import { Injectable } from '@angular/core';
import { RegistrationRepository } from '../registration.repository';
import { Registration } from '../../models/registration.model';
import { MOCK_REGISTRATIONS } from '../../data/mock/mock-registrations';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-tenant-context';

@Injectable({ providedIn: 'root' })
export class MockRegistrationRepository implements RegistrationRepository {
  private registrations: Registration[] = [];
  private idCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    this.registrations = isDemoTenant() ? structuredClone(MOCK_REGISTRATIONS) : [];
    this.idCounter = this.registrations.length;
  }

  async getAll(): Promise<Registration[]> {
    this.ensureSeed();
    return new Promise(resolve =>
      setTimeout(() => resolve(structuredClone(this.registrations)), 400)
    );
  }

  async getByTournament(tournamentId: string): Promise<Registration[]> {
    this.ensureSeed();
    return this.registrations.filter(r => r.tournamentId === tournamentId);
  }

  async getByPlayer(playerId: string): Promise<Registration[]> {
    this.ensureSeed();
    return this.registrations.filter(r =>
      r.participants.some(p => p.playerId === playerId)
    );
  }

  async getById(id: string): Promise<Registration | undefined> {
    this.ensureSeed();
    return this.registrations.find(r => r.id === id);
  }

  async create(registration: Omit<Registration, 'id' | 'registeredAt'>): Promise<Registration> {
    this.ensureSeed();
    const created: Registration = {
      ...registration,
      id: `r${++this.idCounter}`,
      registeredAt: new Date().toISOString()
    };
    this.registrations.push(created);
    return structuredClone(created);
  }

  async update(id: string, changes: Partial<Registration>): Promise<Registration> {
    this.ensureSeed();
    const idx = this.registrations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Registration ${id} not found`);
    this.registrations[idx] = { ...this.registrations[idx], ...changes };
    return structuredClone(this.registrations[idx]);
  }

  async delete(id: string): Promise<void> {
    this.ensureSeed();
    this.registrations = this.registrations.filter(r => r.id !== id);
  }

  isDuplicateParticipantSet(tournamentId: string, playerIds: string[]): boolean {
    this.ensureSeed();
    const sortedIds = [...playerIds].sort();
    return this.registrations
      .filter(r => r.tournamentId === tournamentId)
      .some(r => {
        const existingIds = r.participants.map(p => p.playerId).sort();
        return existingIds.length === sortedIds.length &&
          existingIds.every((id, i) => id === sortedIds[i]);
      });
  }
}
