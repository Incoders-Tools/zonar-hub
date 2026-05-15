import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmedPairsPageComponent } from './confirmed-pairs-page.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ConfirmedPairsPageComponent', () => {
  let component: ConfirmedPairsPageComponent;
  let fixture: ComponentFixture<ConfirmedPairsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmedPairsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmedPairsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty pairs', () => {
    expect(component.pairs().length).toBe(0);
  });

  it('should show empty state when no pairs', () => {
    const empty = fixture.nativeElement.querySelector('.empty');
    expect(empty).toBeTruthy();
  });
});
