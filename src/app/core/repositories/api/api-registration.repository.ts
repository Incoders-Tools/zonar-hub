import { Injectable } from '@angular/core';
import { Registration } from '../../models/registration.model';
import { RegistrationRepository } from '../registration.repository';

@Injectable({ providedIn: 'root' })
export class ApiRegistrationRepository implements RegistrationRepository {
  async getAll(): Promise<Registration[]> {
    return [];
  }

  async getByTournament(_tournamentId: string): Promise<Registration[]> {
    return [];
  }

  async getByPlayer(_playerId: string): Promise<Registration[]> {
    return [];
  }

  async getById(_id: string): Promise<Registration | undefined> {
    return undefined;
  }

  async create(_registration: Omit<Registration, 'id' | 'registeredAt'>): Promise<Registration> {
    throw new Error('common.featureNotAvailable');
  }

  async update(_id: string, _registration: Partial<Registration>): Promise<Registration> {
    throw new Error('common.featureNotAvailable');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('common.featureNotAvailable');
  }

  isDuplicateParticipantSet(_tournamentId: string, _playerIds: string[]): boolean {
    return false;
  }
}
