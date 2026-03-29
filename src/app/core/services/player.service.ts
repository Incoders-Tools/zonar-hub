import { Injectable, signal, computed } from '@angular/core';
import { Player } from '../models';
import { MOCK_PLAYERS } from '../data/mock/mock-players';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly playersState = signal<Player[]>(MOCK_PLAYERS);
  private readonly loadingState = signal(false);

  readonly players = this.playersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  async loadPlayers(): Promise<void> {
    this.loadingState.set(true);
    await this.delay(500);
    this.playersState.set(MOCK_PLAYERS);
    this.loadingState.set(false);
  }

  async searchPlayers(query: string): Promise<Player[]> {
    await this.delay(300);
    const q = query.toLowerCase();
    return this.playersState().filter(p =>
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  }

  getPlayerById(id: string): Player | undefined {
    return this.playersState().find(p => p.id === id);
  }

  async savePlayer(player: Partial<Player>): Promise<Player> {
    await this.delay(600);
    const existing = this.playersState().find(p => p.id === player.id);
    if (existing) {
      const updated = { ...existing, ...player };
      this.playersState.update(items => items.map(p => p.id === updated.id ? updated : p));
      return updated;
    }
    const created: Player = { ...player as Player, id: 'p-' + Date.now(), createdAt: new Date().toISOString() };
    this.playersState.update(items => [...items, created]);
    return created;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
