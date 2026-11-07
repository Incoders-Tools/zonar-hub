import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminOnboardingPageComponent } from './admin-onboarding-page.component';
import { provideHttpClient } from '@angular/common/http';

describe('AdminOnboardingPageComponent', () => {
  let component: AdminOnboardingPageComponent;
  let fixture: ComponentFixture<AdminOnboardingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOnboardingPageComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOnboardingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start at step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to next step when form is valid', () => {
    component.orgForm.patchValue({ displayName: 'My Organization', type: 'circuito' });
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back to previous step', () => {
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  describe('sport icons', () => {
    beforeEach(() => {
      component.availableSports.set([
        { id: 'sp1', name: 'Pádel', key: 'padel', icon: 'padel', iconSource: 'svg', modalityIds: [], sortOrder: 1, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 'sp2', name: 'Fútbol', key: 'futbol', icon: '⚽', iconSource: 'unicode', modalityIds: [], sortOrder: 2, isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]);
      component.currentStep.set(3);
      fixture.detectChanges();
    });

    it('renders the svg drawing for an svg-source sport option', () => {
      const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.onboarding__sport-option'));

      expect(options[0].querySelector('img.sport-icon--svg')?.getAttribute('src')).toBe('uploads/sports-icons/padel.svg');
      expect(options[0].textContent).not.toContain('padel');
    });

    it('renders the emoji for a unicode-source sport option', () => {
      const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.onboarding__sport-option'));

      expect(options[1].querySelector('.sport-icon--unicode')?.textContent?.trim()).toBe('⚽');
    });
  });
});
