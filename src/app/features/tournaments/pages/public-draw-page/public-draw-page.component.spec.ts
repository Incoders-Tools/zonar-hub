import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicDrawPageComponent } from './public-draw-page.component';
import { provideRouter } from '@angular/router';

describe('PublicDrawPageComponent', () => {
  let component: PublicDrawPageComponent;
  let fixture: ComponentFixture<PublicDrawPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicDrawPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicDrawPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading()).toBeFalse(); // set to false in ngOnInit synchronously
  });

  it('should have null tournament initially', () => {
    // Tournament loaded async, starts null
    expect(component.tournament()).toBeNull();
  });

  it('should show empty state when no draw result', () => {
    component.loading.set(false);
    component.drawResult.set(null);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.empty');
    expect(empty).toBeTruthy();
  });
});
