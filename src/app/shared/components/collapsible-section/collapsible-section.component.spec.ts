import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CollapsibleSectionComponent } from './collapsible-section.component';

describe('CollapsibleSectionComponent', () => {
  let component: CollapsibleSectionComponent;
  let fixture: ComponentFixture<CollapsibleSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapsibleSectionComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CollapsibleSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('titleKey', 'test.title');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start collapsed by default', () => {
    expect(component.isExpanded()).toBeFalse();
  });

  it('should toggle expanded state', () => {
    component.toggle();
    expect(component.isExpanded()).toBeTrue();
    component.toggle();
    expect(component.isExpanded()).toBeFalse();
  });

  it('should emit expandedChange on toggle', () => {
    spyOn(component.expandedChange, 'emit');
    component.toggle();
    expect(component.expandedChange.emit).toHaveBeenCalledWith(true);
  });
});
