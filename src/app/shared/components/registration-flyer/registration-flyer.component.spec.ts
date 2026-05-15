import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrationFlyerComponent } from './registration-flyer.component';

describe('RegistrationFlyerComponent', () => {
  let component: RegistrationFlyerComponent;
  let fixture: ComponentFixture<RegistrationFlyerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationFlyerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationFlyerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      tournamentName: 'Test Tournament',
      date: '2026-01-01',
      location: 'Test Location',
      playerNames: ['Player A', 'Player B']
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
