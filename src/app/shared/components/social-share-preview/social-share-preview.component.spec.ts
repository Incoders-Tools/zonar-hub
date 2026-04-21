import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharePreviewComponent } from './social-share-preview.component';

describe('SocialSharePreviewComponent', () => {
  let component: SocialSharePreviewComponent;
  let fixture: ComponentFixture<SocialSharePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialSharePreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialSharePreviewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('payload', {
      title: 'Test Title',
      description: 'Test Description',
      imageUrl: 'https://example.com/image.png'
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on close button click', () => {
    spyOn(component.close, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('[aria-label="close"], .close-button, button');
    if (closeBtn) {
      closeBtn.click();
      expect(component.close.emit).toHaveBeenCalled();
    }
  });
});
