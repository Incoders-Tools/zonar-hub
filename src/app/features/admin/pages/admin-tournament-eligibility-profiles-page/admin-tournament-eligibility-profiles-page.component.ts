import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table/data-table.component';
import { FilterPanelComponent, FilterField } from '../../../../shared/components/filter-panel/filter-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AsyncButtonComponent } from '../../../../shared/components/async-button/async-button.component';
import { TournamentEligibilityProfile } from '../../../../core/models';
import { HelpButtonComponent, HelpSection } from '../../../../shared/components/help-button/help-button.component';
import { TournamentEligibilityProfilesFacadeService, TournamentEligibilityProfileFilters } from './tournament-eligibility-profiles-facade.service';
import { TournamentEligibilityProfilesFormDialogComponent } from './tournament-eligibility-profiles-form-dialog/tournament-eligibility-profiles-form-dialog.component';

interface TournamentEligibilityProfileRow extends Record<string, unknown> {
  id: string;
  name: string;
  key: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  slotCount: number;
  statusLabel: string;
}

@Component({
  selector: 'app-admin-tournament-eligibility-profiles-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    FilterPanelComponent,
    ConfirmDialogComponent,
    AsyncButtonComponent,
    TournamentEligibilityProfilesFormDialogComponent,
    HelpButtonComponent
  ],
  providers: [TournamentEligibilityProfilesFacadeService],
  templateUrl: './admin-tournament-eligibility-profiles-page.component.html',
  styleUrl: './admin-tournament-eligibility-profiles-page.component.scss',
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
export class AdminTournamentEligibilityProfilesPageComponent implements OnInit {
  readonly facade = inject(TournamentEligibilityProfilesFacadeService);

  readonly showFormPanel = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly showBulkDeleteDialog = signal(false);
  readonly editingProfile = signal<TournamentEligibilityProfile | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly selectedProfiles = signal<TournamentEligibilityProfileRow[]>([]);

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.tournament-eligibility-profiles.column.name', sortable: true },
    { key: 'key', labelKey: 'admin.tournament-eligibility-profiles.column.key', sortable: true },
    { key: 'description', labelKey: 'admin.tournament-eligibility-profiles.column.description', sortable: false },
    { key: 'slotCount', labelKey: 'admin.tournament-eligibility-profiles.column.slots', sortable: false },
    { key: 'sortOrder', labelKey: 'admin.tournament-eligibility-profiles.column.sortOrder', sortable: true },
    { key: 'statusLabel', labelKey: 'admin.tournament-eligibility-profiles.column.status', sortable: true }
  ];

  readonly profileRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly filterFields: FilterField[] = [
    { key: 'name', labelKey: 'admin.tournament-eligibility-profiles.filter.name', type: 'text' },
    {
      key: 'isActive', labelKey: 'admin.tournament-eligibility-profiles.filter.status', type: 'select',
      options: [
        { value: 'true', labelKey: 'admin.tournament-eligibility-profiles.status.active' },
        { value: 'false', labelKey: 'admin.tournament-eligibility-profiles.status.inactive' }
      ]
    }
  ];

  readonly tableData = computed<TournamentEligibilityProfileRow[]>(() =>
    this.facade.filteredProfiles().map(p => ({
      id: p.id,
      name: p.name,
      key: p.key,
      description: p.description,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      slotCount: p.slots?.length ?? 0,
      statusLabel: p.isActive ? 'admin.tournament-eligibility-profiles.status.active' : 'admin.tournament-eligibility-profiles.status.inactive'
    }))
  );

  readonly hasSelection = computed(() => this.selectedProfiles().length > 0);

  ngOnInit(): void {
    this.facade.load();
  }

  onFiltersApplied(filters: Record<string, string>): void {
    const mapped: TournamentEligibilityProfileFilters = {
      name: filters['name'] || undefined,
      isActive: filters['isActive'] || undefined
    };
    this.facade.applyFilters(mapped);
  }

  onFiltersCleared(): void {
    this.facade.clearFilters();
  }

  onRowActionClicked(event: { action: string; row: TournamentEligibilityProfileRow }): void {
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  openCreate(): void {
    this.editingProfile.set(null);
    this.showFormPanel.set(true);
  }

  openEdit(row: TournamentEligibilityProfileRow): void {
    const profile = this.facade.filteredProfiles().find(p => p.id === row.id);
    if (profile) {
      this.editingProfile.set(profile);
      this.showFormPanel.set(true);
    }
  }

  closeFormPanel(): void {
    this.showFormPanel.set(false);
    this.editingProfile.set(null);
  }

  confirmDelete(row: TournamentEligibilityProfileRow): void {
    this.deletingId.set(row.id);
    this.showDeleteDialog.set(true);
  }

  async executeDelete(): Promise<void> {
    const id = this.deletingId();
    if (id) {
      const success = await this.facade.deleteProfile(id);
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

  onSelectionChanged(rows: TournamentEligibilityProfileRow[]): void {
    this.selectedProfiles.set(rows);
  }

  openBulkDelete(): void {
    if (this.hasSelection()) {
      this.showBulkDeleteDialog.set(true);
    }
  }

  async executeBulkDelete(): Promise<void> {
    const ids = this.selectedProfiles().map(r => r.id);
    const success = await this.facade.bulkDelete(ids);
    if (success) {
      this.showBulkDeleteDialog.set(false);
      this.selectedProfiles.set([]);
    }
  }

  cancelBulkDelete(): void {
    this.showBulkDeleteDialog.set(false);
  }

  readonly helpSections: HelpSection[] = [
    { titleKey: 'admin.tournament-eligibility-profiles.help.section1Title', contentKey: 'admin.tournament-eligibility-profiles.help.section1Description' },
    { titleKey: 'admin.tournament-eligibility-profiles.help.section2Title', contentKey: 'admin.tournament-eligibility-profiles.help.section2Description' },
    { titleKey: 'admin.tournament-eligibility-profiles.help.section3Title', contentKey: 'admin.tournament-eligibility-profiles.help.section3Description' }
  ];

  onSorted(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.facade.applySortOption(`${event.key}_${event.direction}`);
  }
}
