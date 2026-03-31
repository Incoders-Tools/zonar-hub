import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CourtAvailabilityGridComponent } from './court-availability-grid.component';
import { Availability } from '../../../../../core/models';

describe('CourtAvailabilityGridComponent', () => {
  let component: CourtAvailabilityGridComponent;
  let fixture: ComponentFixture<CourtAvailabilityGridComponent>;

  const mockAvailability: Availability[] = [
    { id: 'av1', courtId: 'ct1', dayOfWeek: 1, timeFrom: '08:00', timeTo: '09:00', isAvailable: true, overrideType: null },
    { id: 'av2', courtId: 'ct1', dayOfWeek: 1, timeFrom: '09:00', timeTo: '10:00', isAvailable: false, overrideType: 'blocked' },
    { id: 'av3', courtId: 'ct1', dayOfWeek: 2, timeFrom: '10:00', timeTo: '11:00', isAvailable: true, overrideType: 'partial' },
    { id: 'av4', courtId: 'ct1', dayOfWeek: 5, timeFrom: '14:00', timeTo: '15:00', isAvailable: false, overrideType: 'blocked' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtAvailabilityGridComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CourtAvailabilityGridComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('courtId', 'ct1');
    fixture.componentRef.setInput('availability', mockAvailability);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default selected day to Monday (1)', () => {
    expect(component.selectedDay()).toBe(1);
  });

  it('should build grid with 7 days x 15 hours = 105 total slots', () => {
    fixture.detectChanges();
    const allSlots = component.allSlots();
    expect(allSlots.length).toBe(7);
    const totalSlots = allSlots.reduce((sum, day) => sum + day.length, 0);
    expect(totalSlots).toBe(105);
  });

  it('should have 15 slots per day (08:00-22:00)', () => {
    fixture.detectChanges();
    for (const daySlots of component.allSlots()) {
      expect(daySlots.length).toBe(15);
      expect(daySlots[0].hour).toBe(8);
      expect(daySlots[14].hour).toBe(22);
    }
  });

  it('should initialize slot states from availability data', () => {
    fixture.detectChanges();
    // Monday 08:00 - available
    const monSlots = component.allSlots()[0]; // day index 0 = Monday
    const mon8 = monSlots.find(s => s.hour === 8);
    expect(mon8?.state).toBe('available');

    // Monday 09:00 - blocked
    const mon9 = monSlots.find(s => s.hour === 9);
    expect(mon9?.state).toBe('blocked');

    // Tuesday 10:00 - partial
    const tueSlots = component.allSlots()[1]; // day index 1 = Tuesday
    const tue10 = tueSlots.find(s => s.hour === 10);
    expect(tue10?.state).toBe('partial');
  });

  it('should show current day slots for selected day', () => {
    fixture.detectChanges();
    // Default is Monday
    const currentSlots = component.currentDaySlots();
    expect(currentSlots.length).toBe(15);
    expect(currentSlots[0].dayOfWeek).toBe(1);
  });

  it('should toggle slot state: available -> blocked -> partial -> available', () => {
    fixture.detectChanges();

    // Monday first slot (08:00) is available
    expect(component.currentDaySlots()[0].state).toBe('available');

    component.toggleSlot(0);
    expect(component.currentDaySlots()[0].state).toBe('blocked');

    component.toggleSlot(0);
    expect(component.currentDaySlots()[0].state).toBe('partial');

    component.toggleSlot(0);
    expect(component.currentDaySlots()[0].state).toBe('available');
  });

  it('should select a specific day', () => {
    component.selectDay(3);
    expect(component.selectedDay()).toBe(3);
  });

  it('should navigate to next day', () => {
    component.selectDay(1);
    component.nextDay();
    expect(component.selectedDay()).toBe(2);
  });

  it('should wrap next day from Sunday to Monday', () => {
    component.selectDay(7);
    component.nextDay();
    expect(component.selectedDay()).toBe(1);
  });

  it('should navigate to previous day', () => {
    component.selectDay(3);
    component.previousDay();
    expect(component.selectedDay()).toBe(2);
  });

  it('should wrap previous day from Monday to Sunday', () => {
    component.selectDay(1);
    component.previousDay();
    expect(component.selectedDay()).toBe(7);
  });

  it('should go to weekend (Friday = 5)', () => {
    component.goToWeekend();
    expect(component.selectedDay()).toBe(5);
  });

  it('should identify weekend days (Fri=5, Sat=6, Sun=7)', () => {
    expect(component.isWeekendDay(4)).toBeFalse();
    expect(component.isWeekendDay(5)).toBeTrue();
    expect(component.isWeekendDay(6)).toBeTrue();
    expect(component.isWeekendDay(7)).toBeTrue();
  });

  it('should emit only current day slots on saveDay', () => {
    fixture.detectChanges();
    spyOn(component.availabilitySaved, 'emit');
    component.selectDay(1);
    component.saveDay();
    expect(component.availabilitySaved.emit).toHaveBeenCalled();
    const emitted = (component.availabilitySaved.emit as jasmine.Spy).calls.first().args[0];
    expect(emitted.length).toBe(15);
    expect(emitted.every((s: any) => s.dayOfWeek === 1)).toBeTrue();
  });

  it('should emit all slots across all 7 days on saveAll', () => {
    fixture.detectChanges();
    spyOn(component.availabilitySaved, 'emit');
    component.saveAll();
    expect(component.availabilitySaved.emit).toHaveBeenCalled();
    const emitted = (component.availabilitySaved.emit as jasmine.Spy).calls.first().args[0];
    expect(emitted.length).toBe(105);
  });

  it('should map slot states correctly for emission', () => {
    fixture.detectChanges();
    spyOn(component.availabilitySaved, 'emit');
    component.selectDay(1);
    component.saveDay();
    const emitted = (component.availabilitySaved.emit as jasmine.Spy).calls.first().args[0];

    // 08:00 is available
    const slot08 = emitted.find((s: any) => s.timeFrom === '08:00');
    expect(slot08.isAvailable).toBeTrue();
    expect(slot08.overrideType).toBeNull();

    // 09:00 is blocked
    const slot09 = emitted.find((s: any) => s.timeFrom === '09:00');
    expect(slot09.isAvailable).toBeFalse();
    expect(slot09.overrideType).toBe('blocked');
  });

  it('should format hours correctly', () => {
    expect(component.formatHour(8)).toBe('08:00');
    expect(component.formatHour(14)).toBe('14:00');
    expect(component.formatHour(22)).toBe('22:00');
  });
});
