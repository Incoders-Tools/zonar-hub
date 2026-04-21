import { Component, input, output, signal, computed, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { AsyncButtonComponent } from '../../../../../shared/components/async-button/async-button.component';
import { DateInputComponent } from '../../../../../shared/components/date-input/date-input.component';
import { Availability } from '../../../../../core/models';

type SlotState = 'available' | 'blocked' | 'partial';

export interface GridSlot {
  dayOfWeek: number;
  hour: number;
  timeFrom: string;
  timeTo: string;
  state: SlotState;
}

@Component({
  selector: 'app-court-availability-grid',
  standalone: true,
  imports: [CommonModule, MatIcon, MatTooltipModule, TranslatePipe, AsyncButtonComponent, DateInputComponent],
  templateUrl: './court-availability-grid.component.html',
  styleUrl: './court-availability-grid.component.scss',
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
export class CourtAvailabilityGridComponent implements OnInit, OnChanges {
  readonly courtId = input.required<string>();
  readonly availability = input<Availability[]>([]);
  readonly saving = input(false);

  readonly availabilitySaved = output<Omit<Availability, 'id' | 'courtId'>[]>();

  readonly selectedDay = signal(1); // 1=Mon, 7=Sun
  readonly allSlots = signal<GridSlot[][]>([]); // indexed 0-6 for Mon-Sun

  readonly days = [1, 2, 3, 4, 5, 6, 7];
  readonly dayKeys = [
    'admin.complexes.availability.days.mon',
    'admin.complexes.availability.days.tue',
    'admin.complexes.availability.days.wed',
    'admin.complexes.availability.days.thu',
    'admin.complexes.availability.days.fri',
    'admin.complexes.availability.days.sat',
    'admin.complexes.availability.days.sun'
  ];

  readonly hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22

  readonly currentDaySlots = computed(() => this.allSlots()[this.selectedDay() - 1] || []);

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
    const grid: GridSlot[][] = [];

    for (const day of this.days) {
      const daySlots: GridSlot[] = [];

      for (const hour of this.hours) {
        const timeFrom = `${hour.toString().padStart(2, '0')}:00`;
        const timeTo = `${(hour + 1).toString().padStart(2, '0')}:00`;

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

        daySlots.push({ dayOfWeek: day, hour, timeFrom, timeTo, state });
      }

      grid.push(daySlots);
    }

    this.allSlots.set(grid);
  }

  // --- Day navigation ---

  selectDay(day: number): void {
    this.selectedDay.set(day);
  }

  nextDay(): void {
    this.selectedDay.update(d => d >= 7 ? 1 : d + 1);
  }

  previousDay(): void {
    this.selectedDay.update(d => d <= 1 ? 7 : d - 1);
  }

  goToWeekend(): void {
    this.selectedDay.set(5);
  }

  isWeekendDay(day: number): boolean {
    return day >= 5;
  }

  // --- Slot interaction ---

  toggleSlot(slotIndex: number): void {
    this.allSlots.update(grid => {
      const dayIndex = this.selectedDay() - 1;
      return grid.map((daySlots, di) => {
        if (di !== dayIndex) return daySlots;
        return daySlots.map((slot, si) => {
          if (si !== slotIndex) return slot;
          const nextState: SlotState =
            slot.state === 'available' ? 'blocked' :
            slot.state === 'blocked' ? 'partial' : 'available';
          return { ...slot, state: nextState };
        });
      });
    });
  }

  // --- Save ---

  saveDay(): void {
    const daySlots = this.currentDaySlots();
    const mapped = this.mapSlotsToAvailability(daySlots);
    this.availabilitySaved.emit(mapped);
  }

  saveAll(): void {
    const allDaySlots = this.allSlots().flat();
    const mapped = this.mapSlotsToAvailability(allDaySlots);
    this.availabilitySaved.emit(mapped);
  }

  private mapSlotsToAvailability(slots: GridSlot[]): Omit<Availability, 'id' | 'courtId'>[] {
    return slots.map(s => ({
      dayOfWeek: s.dayOfWeek,
      timeFrom: s.timeFrom,
      timeTo: s.timeTo,
      isAvailable: s.state !== 'blocked',
      overrideType: s.state === 'blocked' ? 'blocked' :
                    s.state === 'partial' ? 'partial' : null
    }));
  }

  // --- Helpers ---

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
