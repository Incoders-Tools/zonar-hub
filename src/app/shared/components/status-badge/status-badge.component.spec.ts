import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', 'open');
    fixture.componentRef.setInput('label', 'tournaments.registrationOpen');
    fixture.detectChanges();
  });

  it('should render badge with correct data-status', () => {
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.getAttribute('data-status')).toBe('open');
  });
});
