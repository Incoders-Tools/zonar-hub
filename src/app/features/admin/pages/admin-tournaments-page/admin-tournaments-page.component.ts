import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField, SortOption, SortRule } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { Tournament } from '../../../../core/models';
import { TournamentsFacadeService, TournamentFilters } from './tournaments-facade.service';
import { TournamentsFormComponent } from './tournaments-form/tournaments-form.component';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { SocialSharePreviewComponent, SocialSharePayload } from '../../../../shared/components/social-share-preview/social-share-preview.component';

interface TournamentRow extends Record<string, unknown> {
  id: string;
  name: string;
  tournamentTypeName: string;
  complexName: string;
  startDate: string;
  endDate: string;
  statusLabel: string;
  statusVariant: string;
  maxPairs: number;
}

@Component({
  selector: 'app-admin-tournaments-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TournamentsFormComponent,
    HelpButtonComponent,
    SocialSharePreviewComponent
  ],
  providers: [TournamentsFacadeService],
  templateUrl: './admin-tournaments-page.component.html',
  styleUrl: './admin-tournaments-page.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class AdminTournamentsPageComponent implements OnInit {
  readonly facade = inject(TournamentsFacadeService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingTournament = signal<Tournament | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedTournaments = signal<TournamentRow[]>([]);
  readonly highlightedRowId = signal<string | null>(null);
  readonly sharePayload = signal<SocialSharePayload | null>(null);
  readonly showPlanEnforcement = signal(false);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tournaments.column.name', sortable: true },
    { key: 'tournamentTypeName', labelKey: 'admin.tournaments.column.type', sortable: false },
    { key: 'complexName', labelKey: 'admin.tournaments.column.complex', sortable: false },
    { key: 'startDate', labelKey: 'admin.tournaments.column.startDate', sortable: true, renderType: 'date' },
    { key: 'endDate', labelKey: 'admin.tournaments.column.endDate', sortable: true, renderType: 'date' },
    { key: 'statusLabel', labelKey: 'admin.tournaments.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' },
    { key: 'maxPairs', labelKey: 'admin.tournaments.column.maxPairs', sortable: false }
  ];

  readonly tournamentRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'share', labelKey: 'common.share', action: 'share', variant: 'default' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields = computed<FilterField[]>(() => [
    { key: 'name', labelKey: 'admin.tournaments.filter.name', type: 'text' },
    {
      key: 'statusLabel', labelKey: 'admin.tournaments.filter.status', type: 'select',
      options: [
        { value: 'upcoming', labelKey: 'admin.tournaments.status.upcoming' },
        { value: 'in_progress', labelKey: 'admin.tournaments.status.in_progress' },
        { value: 'finished', labelKey: 'admin.tournaments.status.finished' }
      ]
    }
  ]);

  readonly sortFields: SortOption[] = [
    { key: 'status', labelKey: 'admin.tournaments.column.status' },
    { key: 'name', labelKey: 'admin.tournaments.column.name' },
    { key: 'startDate', labelKey: 'admin.tournaments.column.startDate' },
    { key: 'endDate', labelKey: 'admin.tournaments.column.endDate' },
    { key: 'complexName', labelKey: 'admin.tournaments.column.complex' },
    { key: 'tournamentTypeName', labelKey: 'admin.tournaments.column.type' },
    { key: 'maxPairs', labelKey: 'admin.tournaments.column.maxPairs' }
  ];

  readonly defaultSortRules: SortRule[] = [
    { field: 'status', dir: 'asc' }
  ];

  readonly tableData = computed<TournamentRow[]>(() =>
    this.facade.filteredTournaments().map(t => {
      const status = this.facade.computeStatus(t.startDate, t.endDate);
      return {
        id: t.id,
        name: t.name,
        tournamentTypeName: t.tournamentTypeName,
        complexName: t.complexName,
        startDate: t.startDate,
        endDate: t.endDate,
        statusLabel: status.labelKey,
        statusVariant: status.key === 'upcoming' ? 'info' : status.key === 'in_progress' ? 'warning' : 'finished',
        maxPairs: t.maxPairs
      };
    })
  );

  readonly hasSelection = computed(() => this.selectedTournaments().length > 0);

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.tournaments.help.section1Title', contentKey: 'admin.tournaments.help.section1Text' },
    { titleKey: 'admin.tournaments.help.section2Title', contentKey: 'admin.tournaments.help.section2Text' },
    { titleKey: 'admin.tournaments.help.section3Title', items: [
      'admin.tournaments.help.section3Item1',
      'admin.tournaments.help.section3Item2',
      'admin.tournaments.help.section3Item3'
    ] }
  ];

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentFilters = {
      name: filters['name'] || undefined,
      statusLabel: filters['statusLabel'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    } else if (event.action === 'share') {
      this.openShare(event.row);
    }
  }

  openCreate(): void {
    const plan = this.tenantContext.planType();
    const needsEnforcement = !plan || plan === 'starter';
    if (needsEnforcement && this.facade.entities().length >= 1) {
      this.showPlanEnforcement.set(true);
      return;
    }
    this.editingTournament.set(null);
    this.showFormPanel.set(true);
  }

  dismissPlanEnforcement(): void {
    this.showPlanEnforcement.set(false);
  }

  goToBilling(): void {
    this.showPlanEnforcement.set(false);
    this.router.navigate(['/admin/billing']);
  }

  openEdit(row: TournamentRow): void {
    const tournament = this.facade.filteredTournaments().find(t => t.id === row.id);
    if (tournament) {
      this.editingTournament.set(tournament);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingTournament.set(null);
  }

  confirmDelete(row: TournamentRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteTournament(id);
      if (success) {
        this.showDeleteDialog.set(false);
        this.deletingId.set(null);
      }
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }

  onSelectionChanged(rows: TournamentRow[]): void {
    this.selectedTournaments.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedTournaments().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedTournaments.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }

  onSortRulesChanged(rules: SortRule[]): void {
    this.facade.applySortRules(rules);
  }

  openShare(row: TournamentRow): void {
    const tournament = this.facade.filteredTournaments().find(t => t.id === row.id);
    if (!tournament) return;
    this.sharePayload.set({
      type: 'tournament',
      title: tournament.name,
      subtitle: tournament.complexName,
      lines: [
        `📅 ${tournament.startDate} → ${tournament.endDate}`,
        `🏆 ${tournament.tournamentTypeName}`,
        `👥 ${tournament.maxPairs} parejas máx.`
      ]
    });
  }

  closeSharePreview(): void {
    this.sharePayload.set(null);
  }
}
