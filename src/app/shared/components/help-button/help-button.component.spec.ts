import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpButtonComponent, HelpSection } from './help-button.component';

describe('HelpButtonComponent', () => {
  let component: HelpButtonComponent;
  let fixture: ComponentFixture<HelpButtonComponent>;

  const mockSections: HelpSection[] = [
    { titleKey: 'test.section1', contentKey: 'test.content1' },
    { titleKey: 'test.section2', items: ['test.item1', 'test.item2'] }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpButtonComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(HelpButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('titleKey', 'test.title');
    fixture.componentRef.setInput('sections', mockSections);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be closed by default', () => {
    expect(component.isOpen()).toBeFalse();
  });

  it('should open on open()', () => {
    component.open();
    expect(component.isOpen()).toBeTrue();
  });

  it('should close on close()', () => {
    component.open();
    component.close();
    expect(component.isOpen()).toBeFalse();
  });
});
