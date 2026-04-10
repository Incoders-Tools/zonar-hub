import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvailabilitySelectorComponent } from './availability-selector.component';

describe('AvailabilitySelectorComponent', () => {
  let component: AvailabilitySelectorComponent;
  let fixture: ComponentFixture<AvailabilitySelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilitySelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AvailabilitySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default days', () => {
    expect(component.slots().length).toBe(3);
    expect(component.slots()[0].day).toBe('friday');
  });

  it('should toggle a slot', () => {
    component.toggleSlot(0, 'morning');
    expect(component.isSlotActive(0, 'morning')).toBe(true);
  });

  it('should emit change on toggle', () => {
    const spy = jest.spyOn(component.changed, 'emit');
    component.toggleSlot(1, 'afternoon');
    expect(spy).toHaveBeenCalled();
  });
});
