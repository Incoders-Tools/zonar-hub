import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { DataTableComponent, DataTableColumn } from '../../../../../shared/components/data-table/data-table.component';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Court } from '../../../../../core/models';
import { Sport } from '../../../../../core/models';
import { ActiveToggleComponent } from '../../../../../shared/components/active-toggle/active-toggle.component';

interface CourtRow extends Record<string, unknown> {
  id: string;
  name: string;
  surfaceType: string | undefined;
  surfaceTypeLabel: string;
  isIndoor: boolean | undefined;
  isActive: boolean;
  indoorLabel: string;
  statusLabel: string;
  statusVariant: string;
}

@Component({
  selector: 'app-complex-courts-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIcon,
    TranslatePipe,
    DataTableComponent,
    AsyncButtonComponent,
    ConfirmDialogComponent,
    ActiveToggleComponent
  ],
  templateUrl: './complex-courts-panel.component.html',
  styleUrl: './complex-courts-panel.component.scss',
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
export class ComplexCourtsPanelComponent {
  private readonly fb = inject(FormBuilder);

  readonly complexId = input<string>('');
  readonly draftMode = input(false);
  readonly availabilityOnly = input(false);
  readonly courts = input.required<Court[]>();
  readonly loading = input(false);
  readonly mutationsBlocked = input(false);
  readonly saving = input(false);
  readonly activeCourtId = input<string | null>(null);
  readonly sports = input<Sport[]>([]);

  readonly courtSaved = output<Court | Omit<Court, 'id'>>();
  readonly courtDeleted = output<string>();
  readonly availabilityRequested = output<string>();
  readonly editorOpen = output<boolean>();

  readonly showForm = signal(false);
  readonly editingCourt = signal<Court | null>(null);
  readonly showDeleteDialog = signal(false);
  readonly deletingId = signal<string | null>(null);

  courtForm!: FormGroup;

  readonly columns: DataTableColumn[] = [
    { key: 'name', labelKey: 'admin.complexes.courts.column.name', sortable: true },
    { key: 'surfaceTypeLabel', labelKey: 'admin.complexes.courts.column.surfaceType', sortable: true, translate: true },
    { key: 'indoorLabel', labelKey: 'admin.complexes.courts.column.isIndoor', sortable: false, translate: true },
    { key: 'statusLabel', labelKey: 'admin.complexes.courts.column.status', sortable: true, renderType: 'pill', translate: true, pillVariantKey: 'statusVariant' }
  ];

  readonly courtRowActions = [
    { icon: 'edit', labelKey: 'common.edit', action: 'edit', variant: 'primary' as const },
    { icon: 'calendar_month', labelKey: 'admin.complexes.courts.action.availability', action: 'availability', variant: 'default' as const },
    { icon: 'delete', labelKey: 'common.delete', action: 'delete', variant: 'danger' as const }
  ];

  readonly draftRowActions = this.courtRowActions.filter(action => action.action !== 'availability');
  readonly availabilityRowActions = this.courtRowActions.filter(action => action.action === 'availability');

  get rowActions() {
    return this.availabilityOnly() ? this.availabilityRowActions : this.draftMode() ? this.draftRowActions : this.courtRowActions;
  }
  readonly surfaceTypes = ['synthetic', 'cement', 'grass', 'clay'];

  get tableData(): CourtRow[] {
    return this.courts().map(ct => ({
      id: ct.id,
      name: ct.name,
      surfaceType: ct.surfaceType,
      surfaceTypeLabel: `admin.complexes.courts.surfaceType.${ct.surfaceType}`,
      isIndoor: ct.isIndoor,
      isActive: ct.isActive,
      indoorLabel: ct.isIndoor ? 'admin.complexes.courts.indoor' : 'admin.complexes.courts.outdoor',
      statusLabel: ct.isActive ? 'admin.complexes.status.active' : 'admin.complexes.status.inactive',
      statusVariant: ct.isActive ? 'active' : 'inactive'
    }));
  }

  openCreate(): void {
    if (this.availabilityOnly() || this.loading() || this.mutationsBlocked()) return;
    this.editingCourt.set(null);
    this.initForm();
    this.showForm.set(true);
    this.editorOpen.emit(true);
  }

  openEdit(row: CourtRow): void {
    if (this.availabilityOnly() || this.loading() || this.mutationsBlocked()) return;
    const court = this.courts().find(ct => ct.id === row.id);
    if (court) {
      this.editingCourt.set(court);
      this.initForm(court);
      this.showForm.set(true);
      this.editorOpen.emit(true);
    }
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editorOpen.emit(false);
    this.editingCourt.set(null);
  }

  private initForm(court?: Court): void {
    this.courtForm = this.fb.group({
      name: [court?.name || '', [Validators.required]],
      sportIds: [court?.sportIds || []],
      surfaceType: [court?.surfaceType || 'synthetic'],
      isIndoor: [court?.isIndoor ?? false],
      isActive: [court?.isActive ?? true]
    });
  }

  toggleSport(sportId: string): void {
    const current: string[] = this.courtForm.get('sportIds')?.value || [];
    const updated = current.includes(sportId)
      ? current.filter(id => id !== sportId)
      : [...current, sportId];
    this.courtForm.get('sportIds')?.setValue(updated);
  }

  isSportSelected(sportId: string): boolean {
    const current: string[] = this.courtForm.get('sportIds')?.value || [];
    return current.includes(sportId);
  }

  saveCourt(): void {
    if (this.availabilityOnly() || this.loading() || this.mutationsBlocked() || !this.courtForm?.valid) return;

    const formValue = this.courtForm.getRawValue();
    const editing = this.editingCourt();

    if (editing) {
      this.courtSaved.emit({ ...editing, ...formValue });
    } else {
      this.courtSaved.emit({
        complexId: this.complexId(),
        ...formValue
      });
    }

    this.closeForm();
  }

  onRowAction(event: { action: string; row: CourtRow }): void {
    if (this.availabilityOnly() && event.action !== 'availability') return;
    if ((this.loading() || this.mutationsBlocked()) && event.action !== 'availability') return;
    if (event.action === 'edit') {
      this.openEdit(event.row);
    } else if (event.action === 'delete') {
      this.deletingId.set(event.row.id);
      this.showDeleteDialog.set(true);
    } else if (event.action === 'availability' && !this.draftMode() && this.courts().some(court => court.id === event.row.id)) {
      this.availabilityRequested.emit(event.row.id);
    }
  }

  executeDelete(): void {
    if (this.availabilityOnly() || this.loading() || this.mutationsBlocked()) return;
    const id = this.deletingId();
    if (id) {
      this.courtDeleted.emit(id);
      this.showDeleteDialog.set(false);
      this.deletingId.set(null);
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingId.set(null);
  }
}
