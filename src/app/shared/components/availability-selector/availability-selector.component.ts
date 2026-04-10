import { Component, input, output, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface AvailabilitySlot {
  day: string;
  dayKey: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

export interface AvailabilitySelection {
  slots: AvailabilitySlot[];
  notes: string;
}

@Component({
  selector: 'app-availability-selector',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './availability-selector.component.html',
  styleUrl: './availability-selector.component.scss'
})
export class AvailabilitySelectorComponent implements OnInit {
  readonly days = input<string[]>(['friday', 'saturday', 'sunday']);
  readonly showNotes = input(true);
  readonly notesPlaceholderKey = input('registration.notesPlaceholder');
  readonly value = input<AvailabilitySelection | null>(null);

  readonly changed = output<AvailabilitySelection>();

  readonly notesControl = new FormControl('');
  readonly slots = signal<AvailabilitySlot[]>([]);

  readonly dayConfigs = computed(() =>
    this.days().map(day => ({
      day,
      dayKey: `registration.${day}`,
      morning: false,
      afternoon: false,
      evening: false
    }))
  );

  readonly timeSlots = [
    { key: 'morning', labelKey: 'registration.morning', icon: '☀️' },
    { key: 'afternoon', labelKey: 'registration.afternoon', icon: '🌤️' },
    { key: 'evening', labelKey: 'registration.evening', icon: '🌙' }
  ];

  ngOnInit(): void {
    const initial = this.value();
    if (initial) {
      this.slots.set(initial.slots);
      this.notesControl.setValue(initial.notes);
    } else {
      this.slots.set(this.dayConfigs().map(d => ({
        ...d,
        morning: d.day === 'saturday' || d.day === 'sunday',
        afternoon: false,
        evening: false
      })));
    }
  }

  toggleSlot(dayIndex: number, timeKey: string): void {
    this.slots.update(current => {
      const updated = [...current];
      updated[dayIndex] = {
        ...updated[dayIndex],
        [timeKey]: !updated[dayIndex][timeKey as keyof AvailabilitySlot]
      };
      return updated;
    });
    this.emitChange();
  }

  isSlotActive(dayIndex: number, timeKey: string): boolean {
    const slot = this.slots()[dayIndex];
    return slot ? (slot[timeKey as keyof AvailabilitySlot] as boolean) : false;
  }

  onNotesChange(): void {
    this.emitChange();
  }

  private emitChange(): void {
    this.changed.emit({
      slots: this.slots(),
      notes: this.notesControl.value ?? ''
    });
  }
}
