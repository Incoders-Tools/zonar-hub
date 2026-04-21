import { Injectable } from '@angular/core';
import { TournamentRuleSet } from '../../models';
import { TournamentRuleSetRepository } from '../tournament-rule-set.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'tournament_rule_sets';

interface TrsStorageState { data: TournamentRuleSet[]; counter: number; }

const MOCK_TOURNAMENT_RULE_SETS: TournamentRuleSet[] = [
  {
    id: 'trs1',
    tournamentTypeId: 'tt1',
    tournamentTypeName: 'Round Robin',
    rulesJson: JSON.stringify({
      minPlayers: 4,
      maxPlayers: 16,
      matchesPerRound: 1,
      pointsForWin: 3,
      pointsForLoss: 0
    }, null, 2),
    descriptionText: 'En un Round Robin, todos los participantes juegan contra todos. Se acumulan puntos por victoria y al final se determina el ganador por tabla de posiciones.',
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 'trs2',
    tournamentTypeId: 'tt2',
    tournamentTypeName: 'Eliminación Directa',
    rulesJson: JSON.stringify({
      seeded: true,
      thirdPlaceMatch: true,
      bestOfSets: 3
    }, null, 2),
    descriptionText: 'En eliminación directa, cada partido es decisivo. El perdedor queda eliminado y el ganador avanza a la siguiente ronda hasta la final.',
    isActive: true,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z'
  }
];

@Injectable({ providedIn: 'root' })
export class MockTournamentRuleSetRepository implements TournamentRuleSetRepository {
  private ruleSets: TournamentRuleSet[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<TrsStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.ruleSets = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.ruleSets = structuredClone(MOCK_TOURNAMENT_RULE_SETS);
      this.idCounter = this.ruleSets.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.ruleSets, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<TournamentRuleSet[]> {
    return this.delay(structuredClone(this.ruleSets));
  }

  async getById(id: string): Promise<TournamentRuleSet | undefined> {
    const found = this.ruleSets.find(r => r.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(ruleSet: Omit<TournamentRuleSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentRuleSet> {
    const now = new Date().toISOString();
    const newRuleSet: TournamentRuleSet = {
      ...ruleSet,
      id: `trs${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.ruleSets.push(newRuleSet);
    this.persist();
    return this.delay(structuredClone(newRuleSet));
  }

  async update(id: string, changes: Partial<TournamentRuleSet>): Promise<TournamentRuleSet> {
    const idx = this.ruleSets.findIndex(r => r.id === id);
    if (idx === -1) {
      throw new Error(`TournamentRuleSet ${id} not found`);
    }
    this.ruleSets[idx] = { ...this.ruleSets[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.ruleSets[idx]));
  }

  async delete(id: string): Promise<void> {
    this.ruleSets = this.ruleSets.filter(r => r.id !== id);
    this.persist();
    return this.delay(undefined);
  }
}
