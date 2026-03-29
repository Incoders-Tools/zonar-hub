import { Injectable, signal, computed } from '@angular/core';
import { Registration, RegistrationAvailability } from '../models';
import { MOCK_REGISTRATIONS } from '../data/mock/mock-registrations';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly registrationsState = signal<Registration[]>(MOCK_REGISTRATIONS);
  private readonly loadingState = signal(false);

  readonly registrations = this.registrationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  getByTournament(tournamentId: string): Registration[] {
    return this.registrationsState().filter(r => r.tournamentId === tournamentId);
  }

  getConfirmedByTournament(tournamentId: string): Registration[] {
    return this.getByTournament(tournamentId).filter(r => r.statusId === 'rs1');
  }

  getByPlayer(playerId: string): Registration[] {
    return this.registrationsState().filter(r => r.player1Id === playerId || r.player2Id === playerId);
  }

  isDuplicatePair(tournamentId: string, player1Id: string, player2Id: string): boolean {
    return this.getByTournament(tournamentId).some(r =>
      (r.player1Id === player1Id && r.player2Id === player2Id) ||
      (r.player1Id === player2Id && r.player2Id === player1Id)
    );
  }

  async submitRegistration(registration: Omit<Registration, 'id' | 'registeredAt'>): Promise<Registration> {
    await this.delay(1000);
    const created: Registration = {
      ...registration,
      id: 'r-' + Date.now(),
      registeredAt: new Date().toISOString()
    };
    this.registrationsState.update(items => [...items, created]);
    return created;
  }

  async saveAvailability(registrationId: string, availability: RegistrationAvailability[]): Promise<void> {
    await this.delay(500);
  }

  async sendVerificationCode(registrationId: string): Promise<string> {
    await this.delay(500);
    return '123456';
  }

  async verifyCode(registrationId: string, code: string): Promise<boolean> {
    await this.delay(500);
    return code === '123456';
  }

  async confirmRegistration(registrationId: string): Promise<void> {
    await this.delay(500);
    this.registrationsState.update(items =>
      items.map(r => r.id === registrationId
        ? { ...r, statusId: 'rs1', statusLabel: 'Confirmada', confirmedAt: new Date().toISOString() }
        : r
      )
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
