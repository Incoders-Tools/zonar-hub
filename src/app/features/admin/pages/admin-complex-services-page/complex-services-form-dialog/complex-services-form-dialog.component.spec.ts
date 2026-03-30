import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexServicesFormDialogComponent } from './complex-services-form-dialog.component';
import { ComplexServicesFacadeService } from '../complex-services-facade.service';
import { MockComplexServiceRepository } from '../../../../../core/repositories/mock/mock-complex-service.repository';
import { ComplexService } from '../../../../../core/models';

describe('ComplexServicesFormDialogComponent', () => {
  let component: ComplexServicesFormDialogComponent;
  let fixture: ComponentFixture<ComplexServicesFormDialogComponent>;
  let facade: ComplexServicesFacadeService;

  const mockService: ComplexService = {
    id: 'cs1',
    name: 'WiFi',
    key: 'wifi',
    faIcon: 'FaWifi',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexServicesFormDialogComponent],
      providers: [ComplexServicesFacadeService, MockComplexServiceRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexServicesFormDialogComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ComplexServicesFacadeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode when no service provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('service', null);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('');
  });

  it('should initialize form in edit mode when service provided', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('service', mockService);
    });
    fixture.detectChanges();
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.form.get('name')?.value).toBe(mockService.name);
    expect(component.form.get('key')?.disabled).toBe(true);
  });

  it('should emit cancelled on cancel', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });

  it('should validate form', () => {
    fixture.detectChanges();
    component.ngOnInit();

    const form = component.form;
    form.get('name')?.setValue('');
    expect(form.valid).toBe(false);

    form.get('name')?.setValue('WiFi');
    form.get('key')?.setValue('wifi');
    expect(form.valid).toBe(true);
  });
});
