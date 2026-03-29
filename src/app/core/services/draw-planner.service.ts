import { Injectable, signal } from '@angular/core';
import { DrawPlannerInput, DrawPlannerResult } from '../models';
import { MOCK_DRAW_RESULT } from '../data/mock/mock-draw';

@Injectable({ providedIn: 'root' })
export class DrawPlannerService {
  private readonly resultState = signal<DrawPlannerResult | null>(null);
  private readonly loadingState = signal(false);

  readonly result = this.resultState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  async generateDraw(input: DrawPlannerInput): Promise<DrawPlannerResult> {
    this.loadingState.set(true);
    await this.delay(1500);
    const result = { ...MOCK_DRAW_RESULT, tournamentId: input.tournamentId };
    this.resultState.set(result);
    this.loadingState.set(false);
    return result;
  }

  async publishDraw(tournamentId: string): Promise<void> {
    this.loadingState.set(true);
    await this.delay(800);
    this.resultState.update(r => r ? { ...r, status: 'published' } : r);
    this.loadingState.set(false);
  }

  async saveDraft(tournamentId: string): Promise<void> {
    this.loadingState.set(true);
    await this.delay(500);
    this.loadingState.set(false);
  }

  getPublicDraw(tournamentId: string): DrawPlannerResult | null {
    const r = this.resultState();
    if (r && r.tournamentId === tournamentId && r.status === 'published') {
      return r;
    }
    return MOCK_DRAW_RESULT.status === 'published' ? MOCK_DRAW_RESULT : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
