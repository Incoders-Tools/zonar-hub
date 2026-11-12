import { Injectable, signal } from '@angular/core';
import { Registration, RegistrationToken } from '../models';

/**
 * In-memory leftovers of the legacy registration mock: the registration tokens of the backoffice tokens tab and the
 * player's registrations list, which has no API source yet. Tournament registrations use `ApiRegistrationRepository`
 * (backoffice) and `ApiPublicRegistrationRepository` (public wizard).
 */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly registrationsState = signal<Registration[]>([]);
  private readonly tokensState = signal<RegistrationToken[]>([]);

  readonly tokens = this.tokensState.asReadonly();

  getByPlayer(playerId: string): Registration[] {
    return this.registrationsState().filter(r => r.player1Id === playerId || r.player2Id === playerId);
  }

  async generateToken(tournamentId: string): Promise<RegistrationToken> {
    await this.delay(300);
    const token: RegistrationToken = {
      id: 'tk-' + Date.now(),
      tournamentId,
      code: String(Math.floor(100000 + Math.random() * 900000)),
      isActive: true,
      createdBy: 'Admin',
      assignedTo: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    this.tokensState.update(items => [...items, token]);
    return token;
  }

  async deactivateToken(id: string): Promise<void> {
    await this.delay(300);
    this.tokensState.update(items =>
      items.map(t => t.id === id ? { ...t, isActive: false } : t)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
