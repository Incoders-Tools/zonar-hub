import { Component, input, output, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { Availability } from '../../../../../core/models';

type SlotState = 'available' | 'blocked' | 'partial';

interface GridSlot {
  dayOfWeek: number;
  hour: number;
  timeFrom: string;
  timeTo: string;
  state: SlotState;
}

@Component({
  selector: 'app-court-availability-grid',
  standalone: true,
  imports: [CommonModule, TranslatePipe, AsyncButtonComponent],
  templateUrl: './court-availability-grid.component.html',
  styleUrl: './court-availability-grid.component.scss'
})
export class CourtAvailabilityGridComponent implements OnInit, OnChanges {
  readonly courtId = input.required<string>();
  readonly availability = input<Availability[]>([]);
  readonly saving = input(false);

  readonly availabilitySaved = output<Omit<Availability, 'id' | 'courtId'>[]>();

  readonly gridSlots = signal<GridSlot[]>([]);

  readonly days = [1, 2, 3, 4, 5, 6, 7]; // Mon-Sun
  readonly dayKeys = [
    'admin.complexes.availability.days.mon',
    'admin.complexes.availability.days.tue',
    'admin.complexes.availability.days.wed',
    'admin.complexes.availability.days.thu',
    'admin.complexes.availability.days.fri',
    'admin.complexes.availability.days.sat',
    'admin.complexes.availability.days.sun'
  ];

  readonly hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8-21

  ngOnInit(): void {
    this.buildGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availability']) {
      this.buildGrid();
    }
  }

  private buildGrid(): void {
    const avail = this.availability();
    const slots: GridSlot[] = [];

    for (const day of this.days) {
      for (const hour of this.hours) {
        const timeFrom = `${hour.toString().padStart(2, '0')}:00`;
        const timeTo = `${(hour + 1).toString().padStart(2, '0')}:00`;

        // Find matching availability
        const existing = avail.find(
          a => a.dayOfWeek === day && a.timeFrom === timeFrom
        );

        let state: SlotState = 'available';
        if (existing) {
          if (existing.overrideType === 'blocked' || !existing.isAvailable) {
            state = 'blocked';
          } else if (existing.overrideType === 'partial') {
            state = 'partial';
          } else {
            state = 'available';
          }
        }

        slots.push({ dayOfWeek: day, hour, timeFrom, timeTo, state });
      }
    }

    this.gridSlots.set(slots);
  }

  getSlot(day: number, hour: number): GridSlot | undefined {
    return this.gridSlots().find(s => s.dayOfWeek === day && s.hour === hour);
  }

  toggleSlot(day: number, hour: number): void {
    this.gridSlots.update(slots =>
      slots.map(s => {
        if (s.dayOfWeek === day && s.hour === hour) {
          const nextState: SlotState =
            s.state === 'available' ? 'blocked' :
            s.state === 'blocked' ? 'partial' : 'available';
          return { ...s, state: nextState };
        }
        return s;
      })
    );
  }

  getSlotClass(state: SlotState): string {
    return `availability-grid__cell--${state}`;
  }

  save(): void {
    const slots: Omit<Availability, 'id' | 'courtId'>[] = this.gridSlots().map(s => ({
      dayOfWeek: s.dayOfWeek,
      timeFrom: s.timeFrom,
      timeTo: s.timeTo,
      isAvailable: s.state !== 'blocked',
      overrideType: s.state === 'blocked' ? 'blocked' :
                    s.state === 'partial' ? 'partial' : null
    }));
    this.availabilitySaved.emit(slots);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
