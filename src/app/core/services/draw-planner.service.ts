import { Injectable, signal } from '@angular/core';
import { DrawPlannerInput, DrawPlannerResult } from '../models';
import { MOCK_DRAW_RESULT, MOCK_SAVED_DRAWS } from '../data/mock/mock-draw';

@Injectable({ providedIn: 'root' })
export class DrawPlannerService {
  private readonly resultState = signal<DrawPlannerResult | null>(null);
  private readonly loadingState = signal(false);
  private readonly savedDrawsState = signal<DrawPlannerResult[]>([...MOCK_SAVED_DRAWS]);

  readonly result = this.resultState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly savedDraws = this.savedDrawsState.asReadonly();

  async generateDraw(input: DrawPlannerInput): Promise<DrawPlannerResult> {
    this.loadingState.set(true);
    await this.delay(1500);
    const result: DrawPlannerResult = {
      ...MOCK_DRAW_RESULT,
      id: 'dp-' + Date.now(),
      name: 'Draw ' + new Date().toISOString().slice(0, 10),
      tournamentId: input.tournamentId,
      status: 'draft'
    };
    this.resultState.set(result);
    this.loadingState.set(false);
    return result;
  }

  async getSavedDraws(tournamentId?: string): Promise<DrawPlannerResult[]> {
    await this.delay(300);
    const draws = this.savedDrawsState();
    return tournamentId ? draws.filter(d => d.tournamentId === tournamentId) : draws;
  }

  async saveDraft(result: DrawPlannerResult): Promise<DrawPlannerResult> {
    this.loadingState.set(true);
    await this.delay(500);
    const saved: DrawPlannerResult = {
      ...result,
      id: result.id || 'dp-' + Date.now(),
      status: 'draft'
    };
    this.savedDrawsState.update(draws => {
      const idx = draws.findIndex(d => d.id === saved.id);
      if (idx >= 0) {
        return draws.map(d => d.id === saved.id ? saved : d);
      }
      return [...draws, saved];
    });
    this.resultState.set(saved);
    this.loadingState.set(false);
    return saved;
  }

  async publishDraw(planId: string): Promise<DrawPlannerResult> {
    this.loadingState.set(true);
    await this.delay(800);
    let published: DrawPlannerResult | null = null;
    this.savedDrawsState.update(draws => draws.map(d => {
      if (d.id === planId) {
        published = { ...d, status: 'active' };
        return published;
      }
      return d;
    }));
    if (published) {
      this.resultState.set(published);
    }
    this.loadingState.set(false);
    return published!;
  }

  async deleteDraft(planId: string): Promise<void> {
    this.loadingState.set(true);
    await this.delay(400);
    this.savedDrawsState.update(draws => draws.filter(d => d.id !== planId));
    this.loadingState.set(false);
  }

  getPublicDraw(tournamentId: string): DrawPlannerResult | null {
    const r = this.resultState();
    if (r && r.tournamentId === tournamentId && r.status === 'active') {
      return r;
    }
    return MOCK_DRAW_RESULT.status === 'active' ? MOCK_DRAW_RESULT : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
