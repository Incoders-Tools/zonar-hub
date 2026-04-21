import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { TeamFacadeService } from '../team-facade.service';
import { Team, TeamMember, Sport, Category } from '../../../../../core/models';

@Component({
  selector: 'app-team-form-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    ActiveToggleComponent,
    ChildCollectionGridComponent
  ],
  templateUrl: './team-form-panel.component.html',
  styleUrl: './team-form-panel.component.scss'
})
export class TeamFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TeamFacadeService);

  readonly team = input<Team | null>(null);
  readonly saving = input(false);
  readonly sports = input<Sport[]>([]);
  readonly categories = input<Category[]>([]);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;

  readonly playerColumns: ChildGridColumn[] = [
    { key: 'fullName', labelKey: 'admin.teams.form.player.name', type: 'display' }
  ];

  readonly allPlayers = computed(() =>
    this.facade.players().filter(p => p.isActive).map(p => ({
      id: p.id,
      fullName: `${p.firstName} ${p.lastName}`,
      playerId: p.id,
      playerName: `${p.firstName} ${p.lastName}`
    }))
  );

  readonly selectedPlayerIds = signal<Set<string>>(new Set());
  readonly orderedPlayerIds = signal<string[]>([]);

  get isEditing(): boolean {
    return !!this.team();
  }

  get titleKey(): string {
    return this.isEditing ? 'admin.teams.form.editTitle' : 'admin.teams.form.createTitle';
  }

  ngOnInit(): void {
    const t = this.team();
    this.form = this.fb.group({
      name: [t?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      sportId: [t?.sportId ?? '', [Validators.required]],
      categoryId: [t?.categoryId ?? ''],
      captainId: [t?.captainId ?? ''],
      logoUrl: [t?.logoUrl ?? ''],
      observations: [t?.observations ?? ''],
      isActive: [t?.isActive ?? true]
    });

    if (t?.players?.length) {
      const sorted = [...t.players].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const ids = sorted.map(p => p.playerId);
      this.selectedPlayerIds.set(new Set(ids));
      this.orderedPlayerIds.set(ids);
    }
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  onPlayerSelectionChanged(ids: Set<string>): void {
    this.selectedPlayerIds.set(ids);
    this.form.markAsDirty();
  }

  onPlayerOrderChanged(orderedIds: string[]): void {
    this.orderedPlayerIds.set(orderedIds);
    this.form.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const value = this.form.getRawValue();
    const selectedIds = this.selectedPlayerIds();
    const ordered = this.orderedPlayerIds();

    const allPlayerMap = new Map(
      this.allPlayers().map(p => [p.id, p.fullName])
    );

    const players: TeamMember[] = (ordered.length > 0 ? ordered : [...selectedIds])
      .filter(id => selectedIds.has(id))
      .map((id, idx) => ({
        playerId: id,
        playerName: allPlayerMap.get(id) ?? '',
        sortOrder: idx + 1
      }));

    const captainPlayer = players.find(p => p.playerId === value.captainId);

    const payload: Omit<Team, 'id' | 'createdAt'> = {
      name: value.name,
      sportId: value.sportId,
      sportName: this.facade.getSportName(value.sportId),
      categoryId: value.categoryId || undefined,
      categoryName: value.categoryId ? this.facade.getCategoryName(value.categoryId) : undefined,
      captainId: value.captainId || undefined,
      captainName: captainPlayer?.playerName,
      logoUrl: value.logoUrl || undefined,
      observations: value.observations || undefined,
      players,
      isActive: value.isActive
    };

    const success = await this.facade.save(payload, this.team()?.id);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
