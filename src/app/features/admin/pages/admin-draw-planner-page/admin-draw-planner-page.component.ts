import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { DrawPlannerService } from '../../../../core/services/draw-planner.service';
import { TournamentService } from '../../../../core/services/tournament.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DrawPlannerResult } from '../../../../core/models';

interface PlannerStage {
  labelKey: string;
  target: number;
}

const PLANNER_STAGES: PlannerStage[] = [
  { labelKey: 'planner.stage.validating', target: 12 },
  { labelKey: 'planner.stage.loadingRegistrations', target: 30 },
  { labelKey: 'planner.stage.analyzingAvailability', target: 50 },
  { labelKey: 'planner.stage.generatingZones', target: 72 },
  { labelKey: 'planner.stage.assigningSchedule', target: 88 },
  { labelKey: 'planner.stage.preparingPreview', target: 95 }
];

@Component({
  selector: 'app-admin-draw-planner-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe, ProgressBarComponent],
  templateUrl: './admin-draw-planner-page.component.html',
  styleUrl: './admin-draw-planner-page.component.scss'
})
export class AdminDrawPlannerPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly drawPlannerService = inject(DrawPlannerService);
  private readonly notifications = inject(NotificationService);

  readonly selectedTournamentId = signal('');
  readonly pairsPerZone = signal(4);
  readonly generating = signal(false);
  readonly progress = signal(0);
  readonly currentStageLabel = signal('');
  readonly result = signal<DrawPlannerResult | null>(null);

  get selectedTournament() {
    const id = this.selectedTournamentId();
    return id ? this.tournamentService.getTournamentById(id) : undefined;
  }

  async generate(): Promise<void> {
    const id = this.selectedTournamentId();
    if (!id) return;

    this.generating.set(true);
    this.progress.set(0);
    this.currentStageLabel.set('');
    this.result.set(null);

    try {
      await this.simulateStages();

      const drawResult = await this.drawPlannerService.generateDraw({
        tournamentId: id,
        registrationCount: this.selectedTournament?.maxPairs ?? 16,
        confirmedPairsCount: this.selectedTournament?.maxPairs ?? 16,
        availabilityCoverage: 80,
        tournamentType: this.selectedTournament?.tournamentTypeName ?? 'groups',
        category: this.selectedTournament?.categoryName ?? '',
        gender: this.selectedTournament?.genderLabel ?? '',
        targetGroupSize: this.pairsPerZone(),
        autoManualMix: 'auto',
        seedingStrategy: 'ranking',
        availabilityStrategy: 'best-effort'
      });

      this.progress.set(100);
      this.currentStageLabel.set('');
      this.result.set(drawResult);
      this.notifications.success('drawPlanner.generated');
    } finally {
      this.generating.set(false);
    }
  }

  async publish(): Promise<void> {
    const id = this.selectedTournamentId();
    if (!id) return;
    await this.drawPlannerService.publishDraw(id);
    this.notifications.success('drawPlanner.published');
  }

  async saveDraft(): Promise<void> {
    const id = this.selectedTournamentId();
    if (!id) return;
    await this.drawPlannerService.saveDraft(id);
    this.notifications.success('drawPlanner.savedDraft');
  }

  private async simulateStages(): Promise<void> {
    for (const stage of PLANNER_STAGES) {
      this.currentStageLabel.set(stage.labelKey);
      const current = this.progress();
      const steps = 5;
      const increment = (stage.target - current) / steps;
      for (let i = 0; i < steps; i++) {
        await this.delay(120 + i * 40);
        this.progress.update(v => Math.min(stage.target, v + increment));
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
