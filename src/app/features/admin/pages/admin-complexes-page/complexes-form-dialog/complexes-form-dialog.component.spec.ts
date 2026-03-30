import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexesFormDialogComponent } from './complexes-form-dialog.component';
import { ComplexesFacadeService } from '../complexes-facade.service';
import { MockComplexRepository } from '../../../../../core/repositories/mock/mock-complex.repository';
import { MockComplexServiceRepository } from '../../../../../core/repositories/mock/mock-complex-service.repository';
import { MockSocialNetworkRepository } from '../../../../../core/repositories/mock/mock-social-network.repository';
import { Complex } from '../../../../../core/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ComplexesFormDialogComponent', () => {
  let component: ComplexesFormDialogComponent;
  let fixture: ComponentFixture<ComplexesFormDialogComponent>;

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
      imports: [ComplexesFormDialogComponent, NoopAnimationsModule],
      providers: [
        ComplexesFacadeService,
        MockComplexRepository,
        MockComplexServiceRepository,
        MockSocialNetworkRepository
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexesFormDialogComponent);
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

  it('should switch tabs', () => {
    expect(component.activeFormTab()).toBe('datos');
    component.setActiveTab('servicios');
    expect(component.activeFormTab()).toBe('servicios');
    component.setActiveTab('redes');
    expect(component.activeFormTab()).toBe('redes');
  });
});
