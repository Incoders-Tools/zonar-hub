import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsOfUsePageComponent } from './terms-of-use-page.component';

describe('TermsOfUsePageComponent', () => {
  let fixture: ComponentFixture<TermsOfUsePageComponent>;
  let component: TermsOfUsePageComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfUsePageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TermsOfUsePageComponent);
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

  it('should render all 9 sections', () => {
    const element = fixture.nativeElement as HTMLElement;
    const sections = element.querySelectorAll('.legal-page__section');
    expect(sections.length).toBe(9);
  });
});
