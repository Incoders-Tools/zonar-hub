import { Injectable, inject, signal, computed } from '@angular/core';
import { Player } from '../models';
import { ApiPlayerRepository } from '../repositories/api/api-player.repository';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly repository = inject(ApiPlayerRepository);
  private readonly playersState = signal<Player[]>([]);
  private readonly loadingState = signal(false);

  readonly players = this.playersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  async loadPlayers(): Promise<void> {
    this.loadingState.set(true);
    try {
      const data = await this.repository.getAll();
      this.playersState.set(data);
    } finally {
      this.loadingState.set(false);
    }
  }

  async searchPlayers(query: string): Promise<Player[]> {
    return this.repository.search(query);
  }

  getPlayerById(id: string): Player | undefined {
    return this.playersState().find(p => p.id === id);
  }

  async savePlayer(player: Partial<Player>): Promise<Player> {
    const existing = this.playersState().find(p => p.id === player.id);
    if (existing) {
      const updated = await this.repository.update(existing.id, player);
      this.playersState.update(items => items.map(p => p.id === updated.id ? updated : p));
      return updated;
    }
    const created = await this.repository.create(player as Omit<Player, 'id' | 'createdAt'>);
    this.playersState.update(items => [...items, created]);
    return created;
  }
}
