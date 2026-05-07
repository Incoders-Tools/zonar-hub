import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
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
  imports: [
    FormsModule,
    MatIcon,
    TranslatePipe,
    FormatDatePipe,
    ProgressBarComponent,
    DataTableComponent,
    AsyncButtonComponent,
    ConfirmDialogComponent,
    HelpButtonComponent
  ],
  templateUrl: './admin-draw-planner-page.component.html',
  styleUrl: './admin-draw-planner-page.component.scss'
})
export class AdminDrawPlannerPageComponent {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly drawPlannerService = inject(DrawPlannerService);
  private readonly notifications = inject(NotificationService);

  // --- Tab state ---
  readonly activeTab = signal<'generate' | 'drafts'>('generate');

  // --- Help sections ---
  readonly helpSections: HelpSection[] = [
    { titleKey: 'drawPlanner.help.overview.title', contentKey: 'drawPlanner.help.overview.content' },
    {
      titleKey: 'drawPlanner.help.steps.title',
      items: [
        'drawPlanner.help.steps.step1',
        'drawPlanner.help.steps.step2',
        'drawPlanner.help.steps.step3',
        'drawPlanner.help.steps.step4',
        'drawPlanner.help.steps.step5'
      ]
    },
    { titleKey: 'drawPlanner.help.zones.title', contentKey: 'drawPlanner.help.zones.content' },
    { titleKey: 'drawPlanner.help.drafts.title', contentKey: 'drawPlanner.help.drafts.content' },
    { titleKey: 'drawPlanner.help.tips.title', contentKey: 'drawPlanner.help.tips.content' }
  ];
  readonly helpVideoUrl = 'https://www.youtube.com/embed/PLACEHOLDER_DRAW_VIDEO';

  // --- Generate tab state ---
  readonly selectedTournamentId = signal('');
  readonly pairsPerZone = signal(4);
  readonly generating = signal(false);
  readonly savingDraft = signal(false);
  readonly publishing = signal(false);
  readonly progress = signal(0);
  readonly currentStageLabel = signal('');
  readonly result = signal<DrawPlannerResult | null>(null);

  // --- Saved draws state ---
  readonly savedDraws = signal<DrawPlannerResult[]>([]);
  readonly loadingDraws = signal(false);
  readonly deletingDraft = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly drawToDelete = signal<DrawPlannerResult | null>(null);

  // --- Computed signals ---
  readonly selectedTournament = computed(() => {
    const id = this.selectedTournamentId();
    return id ? this.tournamentService.getTournamentById(id) : undefined;
  });

  readonly tournamentPreview = computed(() => {
    const t = this.selectedTournament();
    if (!t) return null;

    const now = new Date();
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);

    let statusKey: string;
    let statusVariant: string;
    if (now < start) {
      statusKey = 'planner.preview.statusUpcoming';
      statusVariant = 'upcoming';
    } else if (now <= end) {
      statusKey = 'planner.preview.statusInProgress';
      statusVariant = 'in-progress';
    } else {
      statusKey = 'planner.preview.statusFinished';
      statusVariant = 'finished';
    }

    const modalityKey = (t.modalityKey ?? t.modalityName ?? '').toLowerCase();
    const maxLabelKey =
      modalityKey.includes('single') || modalityKey.includes('individual')
        ? 'planner.preview.maxPlayers'
        : modalityKey.includes('team') || modalityKey.includes('equip')
          ? 'planner.preview.maxTeams'
          : 'planner.preview.maxPairs';

    return {
      name: t.name,
      sport: t.sportName ?? null,
      modality: t.modalityName ?? null,
      complex: t.complexName,
      maxPairs: t.maxPairs,
      maxLabelKey,
      startDate: t.startDate,
      endDate: t.endDate,
      statusKey,
      statusVariant,
      registrationStart: t.registrationStartDate,
      registrationEnd: t.registrationEndDate,
      ruleSetDescription: t.ruleSetDescription ?? null,
      courtsCount: (t.selectedCourtIds ?? []).length
    };
  });

  readonly filteredDraws = computed(() =>
    this.savedDraws().filter(d => d.status !== 'finished')
  );

  readonly savedDrawsTableData = computed(() =>
    this.filteredDraws().map(d => ({
      id: d.id,
      name: d.name,
      tournamentName: d.tournamentName,
      status: d.status,
      statusLabelKey: `planner.drafts.status.${d.status}`,
      generatedAt: d.generatedAt
    }))
  );

  // --- Table config ---
  readonly savedDrawColumns: DataTableColumn[] = [
    { key: 'name', labelKey: 'planner.drafts.name', sortable: true },
    { key: 'tournamentName', labelKey: 'planner.drafts.tournament', sortable: true },
    { key: 'statusLabelKey', labelKey: 'planner.drafts.status', renderType: 'pill', translate: true, pillVariantKey: 'status' },
    { key: 'generatedAt', labelKey: 'planner.drafts.createdAt', renderType: 'date', sortable: true }
  ];

  readonly savedDrawActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit' },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly savedDrawActionsFilter = (row: Record<string, unknown>) => {
    if (row['status'] === 'draft') {
      return [
        { icon: 'edit', labelKey: 'common.edit', action: 'edit' },
        { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
      ];
    }
    return [];
  };

  // --- Tab methods ---
  switchTab(tab: 'generate' | 'drafts'): void {
    this.activeTab.set(tab);
    if (tab === 'drafts') {
      this.loadSavedDraws();
    }
  }

  // --- Generate tab methods ---
  async generate(): Promise<void> {
    const id = this.selectedTournamentId();
    if (!id) return;

    this.generating.set(true);
    this.progress.set(0);
    this.currentStageLabel.set('');
    this.result.set(null);

    // On mobile, scroll to the progress bar so the user can follow the generation
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('draw-progress-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }

    try {
      await this.simulateStages();

      const drawResult = await this.drawPlannerService.generateDraw({
        tournamentId: id,
        registrationCount: this.selectedTournament()?.maxPairs ?? 16,
        confirmedPairsCount: this.selectedTournament()?.maxPairs ?? 16,
        availabilityCoverage: 80,
        tournamentType: this.selectedTournament()?.tournamentTypeName ?? 'groups',
        category: this.selectedTournament()?.categoryName ?? '',
        gender: this.selectedTournament()?.genderLabel ?? '',
        targetGroupSize: this.pairsPerZone(),
        autoManualMix: 'auto',
        seedingStrategy: 'ranking',
        availabilityStrategy: 'best-effort'
      });

      drawResult.tournamentName = this.selectedTournament()?.name ?? '';

      this.progress.set(100);
      this.currentStageLabel.set('');
      this.result.set(drawResult);
      this.notifications.success('drawPlanner.generated');

      // On mobile, scroll to the result once generation is complete
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.getElementById('draw-result-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } finally {
      this.generating.set(false);
    }
  }

  async saveDraft(): Promise<void> {
    const r = this.result();
    if (!r) return;

    this.savingDraft.set(true);
    try {
      const saved = await this.drawPlannerService.saveDraft(r);
      this.result.set(saved);
      this.notifications.success('drawPlanner.savedDraft');
    } finally {
      this.savingDraft.set(false);
    }
  }

  async publish(): Promise<void> {
    const r = this.result();
    if (!r) return;

    this.publishing.set(true);
    try {
      let planId = r.id;
      const existsInSaved = this.drawPlannerService.savedDraws().some(d => d.id === planId);
      if (!existsInSaved) {
        const saved = await this.drawPlannerService.saveDraft(r);
        planId = saved.id;
      }
      const published = await this.drawPlannerService.publishDraw(planId);
      this.result.set(published);
      this.notifications.success('drawPlanner.published');
    } finally {
      this.publishing.set(false);
    }
  }

  // --- Saved draws methods ---
  async loadSavedDraws(): Promise<void> {
    this.loadingDraws.set(true);
    try {
      const draws = await this.drawPlannerService.getSavedDraws();
      this.savedDraws.set(draws);
    } finally {
      this.loadingDraws.set(false);
    }
  }

  onDrawRowAction(event: { action: string; row: Record<string, unknown> }): void {
    const drawId = event.row['id'] as string;
    const draw = this.savedDraws().find(d => d.id === drawId);
    if (!draw) return;

    if (event.action === 'edit') {
      this.editDraft(draw);
    } else if (event.action === 'delete') {
      this.drawToDelete.set(draw);
      this.showDeleteConfirm.set(true);
    }
  }

  editDraft(draw: DrawPlannerResult): void {
    this.selectedTournamentId.set(draw.tournamentId);
    this.result.set(draw);
    this.activeTab.set('generate');
  }

  async confirmDelete(): Promise<void> {
    const draw = this.drawToDelete();
    if (!draw) return;

    this.deletingDraft.set(true);
    try {
      await this.drawPlannerService.deleteDraft(draw.id);
      this.showDeleteConfirm.set(false);
      this.drawToDelete.set(null);
      await this.loadSavedDraws();
      this.notifications.success('drawPlanner.draftDeleted');
    } finally {
      this.deletingDraft.set(false);
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.drawToDelete.set(null);
  }

  // --- Private ---
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
