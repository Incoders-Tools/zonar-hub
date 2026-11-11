import { Component, inject, input, output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { CollapsibleSectionComponent } from '../../../../../shared/components/collapsible-section/collapsible-section.component';
import { PhoneInputComponent } from '../../../../../shared/components/phone-input/phone-input.component';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';
import { PlayerFacadeService } from '../player-facade.service';
import { Player, Category, Gender } from '../../../../../core/models';
import { PlayerWrite } from '../../../../../core/repositories/player.repository';
import { NormalizeNameDirective } from '../../../../../shared/directives/normalize-name.directive';
import { NormalizeLowercaseDirective } from '../../../../../shared/directives/normalize-lowercase.directive';
import { DateInputComponent } from '../../../../../shared/components/date-input/date-input.component';

/** Field limits of the API player contract (`PlayerBody`). */
const NAME_MAX = 100;
const SHORT_FIELD_MAX = 40;
const CLUB_MAX = 120;
const EMAIL_MAX = 200;

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
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  form!: FormGroup;
  readonly today = new Date().toISOString().split('T')[0];

  get isEditing(): boolean {
    return !!this.player();
  }

  get titleKey(): string {
    return this.isEditing ? 'admin.players.form.editTitle' : 'admin.players.form.createTitle';
  }

  ngOnInit(): void {
    const p = this.player();
    this.form = this.fb.group({
      firstName: [p?.firstName ?? '', [Validators.required, Validators.maxLength(NAME_MAX)]],
      lastName: [p?.lastName ?? '', [Validators.required, Validators.maxLength(NAME_MAX)]],
      email: [p?.email ?? '', [Validators.email, Validators.maxLength(EMAIL_MAX)]],
      genderId: [p?.genderId ?? ''],
      categoryId: [p?.categoryId ?? ''],
      phone: [p?.phone ?? '', [Validators.maxLength(SHORT_FIELD_MAX)]],
      documentId: [p?.documentId ?? '', [Validators.maxLength(SHORT_FIELD_MAX)]],
      birthDate: [p?.birthDate ?? ''],
      club: [p?.club ?? '', [Validators.maxLength(CLUB_MAX)]],
      isActive: [p?.isActive ?? true]
    });
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.saving() && (!this.isEditing || this.form.dirty);
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;

    const value = this.form.getRawValue();
    const payload: PlayerWrite = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      documentId: value.documentId,
      birthDate: value.birthDate,
      genderId: value.genderId,
      categoryId: value.categoryId,
      club: value.club,
      // The API creates every player active; the status only changes on update
      isActive: this.isEditing ? value.isActive : true
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
