import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryHelpDialogComponent } from './category-help-dialog.component';
import { I18nService } from '../../../../../core/i18n/i18n.service';

describe('CategoryHelpDialogComponent', () => {
  let component: CategoryHelpDialogComponent;
  let fixture: ComponentFixture<CategoryHelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryHelpDialogComponent],
      providers: [I18nService]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryHelpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed on close', () => {
    spyOn(component.closed, 'emit');
    component.onClose();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should render help title', () => {
    const titleEl = fixture.nativeElement.querySelector('.help-dialog__title');
    expect(titleEl).toBeTruthy();
  });

  it('should render all help sections', () => {
    const headings = fixture.nativeElement.querySelectorAll('h4');
    expect(headings.length).toBe(3);
  });
});
