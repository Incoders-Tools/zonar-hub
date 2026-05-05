import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexesFormPanelComponent } from './complexes-form-panel.component';
import { ComplexesFacadeService } from '../complexes-facade.service';
import { MockComplexRepository } from '../../../../../core/repositories/mock/mock-complex.repository';
import { Complex } from '../../../../../core/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ComplexesFormPanelComponent', () => {
  let component: ComplexesFormPanelComponent;
  let fixture: ComponentFixture<ComplexesFormPanelComponent>;

  const mockComplex: Complex = {
    id: 'cx1',
    name: 'Club Pádel Norte',
    key: 'club_padel_norte',
    address: 'Av. Libertador 1234',
    location: 'Palermo',
    cityId: 'city1',
    cityName: 'Buenos Aires',
    description: 'Club premium de pádel',
    sortOrder: 1,
    preponderance: 10,
    sportsSupported: ['sp1'],
    courtsCount: 4,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-01T14:30:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexesFormPanelComponent, NoopAnimationsModule],
      providers: [
        ComplexesFacadeService,
        MockComplexRepository
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexesFormPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no complex provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', null);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when complex provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', mockComplex);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockComplex.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const form = component.form;
    form.get('name')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('Test Complex');
    form.get('key')?.setValue('test_complex');
    expect(form.valid).toBe(true);
  });

  it('should auto-generate key from name', () => {
    fixture.detectChanges();
    component.ngOnInit();

    component.form.get('name')?.setValue('Mi Complejo Nuevo');
    expect(component.form.get('key')?.value).toBe('mi_complejo_nuevo');
  });

  it('should set pendingLogoFile and update logoImagePath when logo is changed', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    const mockPreviewUrl = 'blob:http://localhost/test-preview';

    component.onLogoChanged({ file: mockFile, previewUrl: mockPreviewUrl });

    expect(component.pendingLogoFile()).toBe(mockFile);
    expect(component.form.get('logoImagePath')?.value).toBe(mockPreviewUrl);
    expect(component.form.dirty).toBe(true);
  });

  it('should clear pendingLogoFile and reset logoImagePath when logo is removed', () => {
    fixture.detectChanges();
    component.ngOnInit();

    // First set a file
    const mockFile = new File([''], 'logo.png', { type: 'image/png' });
    component.onLogoChanged({ file: mockFile, previewUrl: 'blob:http://localhost/test' });

    // Then remove it
    component.onLogoRemoved();

    expect(component.pendingLogoFile()).toBeNull();
    expect(component.form.get('logoImagePath')?.value).toBe('');
  });

  it('should return existing logo URL from complex as currentLogoUrl', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', { ...mockComplex, logoImagePath: 'https://cdn.example.com/logo.png' });
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.currentLogoUrl).toBe('https://cdn.example.com/logo.png');
  });

  it('should return null for currentLogoUrl when complex has no logo', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('complex', mockComplex);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.currentLogoUrl).toBeNull();
  });

});
