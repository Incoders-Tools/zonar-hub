import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { PlayerFacadeService } from '../player-facade.service';
import { Player, Category, Gender, Sport } from '../../../../../core/models';

@Component({
  selector: 'app-player-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    FormShellComponent,
    AsyncButtonComponent,
    CollapsibleSectionComponent
  ],
  templateUrl: './player-form-dialog.component.html',
  styleUrl: './player-form-dialog.component.scss'
})
export class PlayerFormDialogComponent implements OnInit {
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
      sportId: [p?.sportId ?? ''],
      phone: [p?.phone ?? ''],
      documentId: [p?.documentId ?? ''],
      birthDate: [p?.birthDate ?? ''],
      city: [p?.city ?? ''],
      ranking: [p?.ranking ?? null, [Validators.min(1)]],
      photoUrl: [p?.photoUrl ?? ''],
      isActive: [p?.isActive ?? true]
    });
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const value = this.form.getRawValue();

    const selectedCategory = this.categories().find(c => c.id === value.categoryId);
    const selectedGender = this.genders().find(g => g.id === value.genderId);
    const selectedSport = this.sports().find(s => s.id === value.sportId);

    const payload: Omit<Player, 'id' | 'createdAt'> = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      genderId: value.genderId,
      genderLabel: selectedGender?.name ?? '',
      categoryId: value.categoryId,
      categoryName: selectedCategory?.name ?? '',
      sportId: value.sportId || undefined,
      sportName: selectedSport?.name ?? '',
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
