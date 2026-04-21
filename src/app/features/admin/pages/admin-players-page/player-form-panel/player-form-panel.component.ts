import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { PhoneInputComponent } from '../../../../../shared/components/phone-input/phone-input.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { ChildCollectionGridComponent, ChildGridColumn } from '../../../../../shared/components/child-collection-grid/child-collection-grid.component';
import { PlayerFacadeService } from '../player-facade.service';
import { Player, PlayerSportAssignment, Category, Gender, Sport } from '../../../../../core/models';
import { NormalizeNameDirective } from '../../../../../shared/directives/normalize-name.directive';
import { NormalizeLowercaseDirective } from '../../../../../shared/directives/normalize-lowercase.directive';
import { DateInputComponent } from '../../../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-player-form-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent,
    PhoneInputComponent,
    ActiveToggleComponent,
    ChildCollectionGridComponent,
    NormalizeNameDirective,
    NormalizeLowercaseDirective,
    DateInputComponent
  ],
  templateUrl: './player-form-panel.component.html',
  styleUrl: './player-form-panel.component.scss'
})
export class PlayerFormPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(PlayerFacadeService);

  readonly player = input<Player | null>(null);
  readonly saving = input(false);
  readonly categories = input<Category[]>([]);
  readonly genders = input<Gender[]>([]);
  readonly sports = input<Sport[]>([]);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly today = new Date().toISOString().split('T')[0];

  readonly sportColumns: ChildGridColumn[] = [
    { key: 'name', labelKey: 'admin.players.sport.name', type: 'display' }
  ];

  readonly sportItems = computed(() =>
    this.sports().filter(s => s.isActive)
  );

  readonly selectedSportIds = signal<Set<string>>(new Set());
  readonly orderedSportIds = signal<string[]>([]);

  get isEditing(): boolean {
    return !!this.player();
  }

  get titleKey(): string {
    return this.isEditing ? 'admin.players.form.editTitle' : 'admin.players.form.createTitle';
  }

  ngOnInit(): void {
    const p = this.player();
    this.form = this.fb.group({
      firstName: [p?.firstName ?? '', [Validators.required, Validators.maxLength(100)]],
      lastName: [p?.lastName ?? '', [Validators.required, Validators.maxLength(100)]],
      email: [p?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(200)]],
      genderId: [p?.genderId ?? '', [Validators.required]],
      categoryId: [p?.categoryId ?? '', [Validators.required]],
      phone: [p?.phone ?? ''],
      documentId: [p?.documentId ?? ''],
      birthDate: [p?.birthDate ?? ''],
      city: [p?.city ?? ''],
      ranking: [p?.ranking ?? null, [Validators.min(1)]],
      photoUrl: [p?.photoUrl ?? ''],
      isActive: [p?.isActive ?? true]
    });

    // Populate sport selection with preserved order
    if (p?.sports?.length) {
      const sortedSports = [...p.sports].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const ids = sortedSports.map(s => s.sportId);
      this.selectedSportIds.set(new Set(ids));
      this.orderedSportIds.set(ids);
    } else if (p?.sportId) {
      this.selectedSportIds.set(new Set([p.sportId]));
      this.orderedSportIds.set([p.sportId]);
    }
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  onSportSelectionChanged(ids: Set<string>): void {
    this.selectedSportIds.set(ids);
    this.form.markAsDirty();
  }

  onSportOrderChanged(orderedIds: string[]): void {
    this.orderedSportIds.set(orderedIds);
    this.form.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const value = this.form.getRawValue();

    const selectedCategory = this.categories().find(c => c.id === value.categoryId);
    const selectedGender = this.genders().find(g => g.id === value.genderId);

    // Build sport assignments from drag-drop order
    const orderedIds = this.orderedSportIds().length > 0
      ? this.orderedSportIds()
      : Array.from(this.selectedSportIds());
    const allSports = this.sports();
    const sportAssignments: PlayerSportAssignment[] = orderedIds
      .map((id, index) => {
        const sport = allSports.find(s => s.id === id);
        return sport ? { sportId: id, sportName: sport.name, sortOrder: index + 1 } : null;
      })
      .filter((s): s is PlayerSportAssignment => s !== null);

    // First selected sport = primary
    const primarySport = sportAssignments[0];

    const payload: Omit<Player, 'id' | 'createdAt'> = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      genderId: value.genderId,
      genderLabel: selectedGender?.name ?? '',
      categoryId: value.categoryId,
      categoryName: selectedCategory?.name ?? '',
      sportId: primarySport?.sportId,
      sportName: primarySport?.sportName ?? '',
      sports: sportAssignments,
      phone: value.phone || undefined,
      documentId: value.documentId || undefined,
      birthDate: value.birthDate || undefined,
      city: value.city || undefined,
      ranking: value.ranking ?? undefined,
      photoUrl: value.photoUrl || undefined,
      isActive: value.isActive,
      updatedAt: new Date().toISOString()
    };

    const success = await this.facade.save(payload, this.player()?.id);
    if (success) {
      this.saved.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
