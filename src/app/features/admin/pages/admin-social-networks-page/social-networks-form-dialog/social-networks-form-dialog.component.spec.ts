import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialNetworksFormDialogComponent } from './social-networks-form-dialog.component';
import { SocialNetworksFacadeService } from '../social-networks-facade.service';
import { MockSocialNetworkRepository } from '../../../../../core/repositories/mock/mock-social-network.repository';
import { SocialNetwork } from '../../../../../core/models';

describe('SocialNetworksFormDialogComponent', () => {
  let component: SocialNetworksFormDialogComponent;
  let fixture: ComponentFixture<SocialNetworksFormDialogComponent>;

  const mockNetwork: SocialNetwork = {
    id: 'sn1',
    name: 'Instagram',
    key: 'instagram',
    url: 'https://instagram.com/',
    description: 'Social platform',
    faIcon: 'FaInstagram',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialNetworksFormDialogComponent],
      providers: [SocialNetworksFacadeService, MockSocialNetworkRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialNetworksFormDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('network', null);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
  });

  it('should initialize form in edit mode', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('network', mockNetwork);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('should validate URL format', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const urlControl = component.form.get('url');
    urlControl?.setValue('invalid-url');
    expect(urlControl?.hasError('pattern')).toBe(true);

    urlControl?.setValue('https://example.com');
    expect(urlControl?.hasError('pattern')).toBe(false);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
