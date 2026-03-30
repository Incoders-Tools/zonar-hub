import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookiePolicyPageComponent } from './cookie-policy-page.component';

describe('CookiePolicyPageComponent', () => {
  let fixture: ComponentFixture<CookiePolicyPageComponent>;
  let component: CookiePolicyPageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiePolicyPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CookiePolicyPageComponent);
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

  it('should render all 6 sections', () => {
    const element = fixture.nativeElement as HTMLElement;
    const sections = element.querySelectorAll('.legal-page__section');
    expect(sections.length).toBe(6);
  });
});
