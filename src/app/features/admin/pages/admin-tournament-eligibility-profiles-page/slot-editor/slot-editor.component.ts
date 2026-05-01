import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-slot-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe
  ],
  template: `
    <div class="slot-editor">
      @if (slotsArray().length === 0) {
        <p class="slot-editor__empty">{{ 'admin.tournament-eligibility-profiles.form.noSlots' | t }}</p>
      } @else {
        <div class="slots-table">
          <div class="slots-table__header">
            <div class="slots-table__col slots-table__col--number">{{ 'admin.tournament-eligibility-profiles.form.slotNumber' | t }}</div>
            <div class="slots-table__col">{{ 'admin.tournament-eligibility-profiles.form.genderId' | t }}</div>
            <div class="slots-table__col">{{ 'admin.tournament-eligibility-profiles.form.categoryId' | t }}</div>
            <div class="slots-table__col slots-table__col--age">{{ 'admin.tournament-eligibility-profiles.form.minAge' | t }}</div>
            <div class="slots-table__col slots-table__col--age">{{ 'admin.tournament-eligibility-profiles.form.maxAge' | t }}</div>
            <div class="slots-table__col slots-table__col--label">{{ 'admin.tournament-eligibility-profiles.form.label' | t }}</div>
            <div class="slots-table__col slots-table__col--action"></div>
          </div>

          @for (slot of slotsArray().controls; let i = $index; track i) {
            <div class="slots-table__row" [formGroup]="$any(slot)">
              <div class="slots-table__col slots-table__col--number">
                <input type="number" formControlName="slotNumber" min="1" />
              </div>
              <div class="slots-table__col">
                <input type="text" formControlName="genderId" placeholder="M/F/Mixed" />
              </div>
              <div class="slots-table__col">
                <input type="text" formControlName="categoryId" placeholder="e.g., U18" />
              </div>
              <div class="slots-table__col slots-table__col--age">
                <input type="number" formControlName="minAge" min="0" />
              </div>
              <div class="slots-table__col slots-table__col--age">
                <input type="number" formControlName="maxAge" min="0" />
              </div>
              <div class="slots-table__col slots-table__col--label">
                <input type="text" formControlName="label" placeholder="e.g., 'Slot A'" />
              </div>
              <div class="slots-table__col slots-table__col--action">
                <button type="button" class="btn-remove-slot" (click)="onRemoveSlot(i)" [attr.aria-label]="'admin.tournament-eligibility-profiles.form.removeSlot' | t">
                  ×
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .slot-editor {
      width: 100%;
    }

    .slot-editor__empty {
      padding: 1rem;
      text-align: center;
      color: var(--color-text-muted, #999);
      font-size: 0.875rem;
      margin: 0;
    }

    .slots-table {
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      overflow: hidden;
    }

    .slots-table__header {
      display: grid;
      grid-template-columns: 80px 1fr 1fr 60px 60px 120px 40px;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: var(--color-bg-secondary, #f5f5f5);
      border-bottom: 1px solid var(--color-border, #ddd);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--color-text-muted, #666);
    }

    .slots-table__row {
      display: grid;
      grid-template-columns: 80px 1fr 1fr 60px 60px 120px 40px;
      gap: 0.5rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--color-border, #eee);
      align-items: center;

      &:last-child {
        border-bottom: none;
      }
    }

    .slots-table__col {
      display: flex;
      align-items: center;

      input {
        width: 100%;
        padding: 0.4rem 0.5rem;
        border: 1px solid var(--color-border, #ccc);
        border-radius: 3px;
        font-size: 0.75rem;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: var(--color-primary, #007bff);
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }
      }

      &--number input {
        text-align: center;
      }

      &--age input {
        text-align: center;
      }

      &--action {
        justify-content: center;
      }
    }

    .btn-remove-slot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 3px;
      border: 1px solid var(--color-danger, #dc3545);
      background-color: var(--color-danger, #dc3545);
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--color-danger-hover, #b02a37);
      }
    }
  `]
})
export class SlotEditorComponent {
  readonly slotsArray = input.required<FormArray>();
  readonly removeSlot = output<number>();

  onRemoveSlot(index: number): void {
    this.removeSlot.emit(index);
  }
}
