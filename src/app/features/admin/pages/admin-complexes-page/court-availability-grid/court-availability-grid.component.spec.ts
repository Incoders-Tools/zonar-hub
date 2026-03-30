import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourtAvailabilityGridComponent } from './court-availability-grid.component';
import { Availability } from '../../../../../core/models';

describe('CourtAvailabilityGridComponent', () => {
  let component: CourtAvailabilityGridComponent;
  let fixture: ComponentFixture<CourtAvailabilityGridComponent>;

  const mockAvailability: Availability[] = [
    { id: 'av1', courtId: 'ct1', dayOfWeek: 1, timeFrom: '08:00', timeTo: '09:00', isAvailable: true, overrideType: null },
    { id: 'av2', courtId: 'ct1', dayOfWeek: 1, timeFrom: '09:00', timeTo: '10:00', isAvailable: false, overrideType: 'blocked' },
    { id: 'av3', courtId: 'ct1', dayOfWeek: 2, timeFrom: '10:00', timeTo: '11:00', isAvailable: true, overrideType: 'partial' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtAvailabilityGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CourtAvailabilityGridComponent);
    component = fixture.componentInstance;

    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('courtId', 'ct1');
      fixture.componentRef.setInput('availability', mockAvailability);
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build grid with 7 days x 14 hours = 98 slots', () => {
    fixture.detectChanges();
    expect(component.gridSlots().length).toBe(98);
  });

  it('should initialize slot states from availability data', () => {
    fixture.detectChanges();
    const mon8 = component.getSlot(1, 8);
    expect(mon8?.state).toBe('available');

    const mon9 = component.getSlot(1, 9);
    expect(mon9?.state).toBe('blocked');

    const tue10 = component.getSlot(2, 10);
    expect(tue10?.state).toBe('partial');
  });

  it('should toggle slot state: available -> blocked -> partial -> available', () => {
    fixture.detectChanges();

    component.toggleSlot(1, 8);
    expect(component.getSlot(1, 8)?.state).toBe('blocked');

    component.toggleSlot(1, 8);
    expect(component.getSlot(1, 8)?.state).toBe('partial');

    component.toggleSlot(1, 8);
    expect(component.getSlot(1, 8)?.state).toBe('available');
  });

  it('should emit availabilitySaved on save', () => {
    fixture.detectChanges();
    spyOn(component.availabilitySaved, 'emit');
    component.save();
    expect(component.availabilitySaved.emit).toHaveBeenCalled();
    const emittedSlots = (component.availabilitySaved.emit as jasmine.Spy).calls.first().args[0];
    expect(emittedSlots.length).toBe(98);
  });

  it('should format hours correctly', () => {
    expect(component.formatHour(8)).toBe('08:00');
    expect(component.formatHour(14)).toBe('14:00');
  });
});
