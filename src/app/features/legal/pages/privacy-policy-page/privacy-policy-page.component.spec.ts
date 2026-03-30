import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyPolicyPageComponent } from './privacy-policy-page.component';

describe('PrivacyPolicyPageComponent', () => {
  let fixture: ComponentFixture<PrivacyPolicyPageComponent>;
  let component: PrivacyPolicyPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;
    const title = element.querySelector('.legal-page__title');
    expect(title).toBeTruthy();
  });

  it('should render all 8 sections', () => {
    const element = fixture.nativeElement as HTMLElement;
    const sections = element.querySelectorAll('.legal-page__section');
    expect(sections.length).toBe(8);
  });
});
