import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComplexServicesPageComponent } from './admin-complex-services-page.component';
import { ComplexServicesFacadeService } from './complex-services-facade.service';
import { MockComplexServiceRepository } from '../../../../core/repositories/mock/mock-complex-service.repository';

describe('AdminComplexServicesPageComponent', () => {
  let component: AdminComplexServicesPageComponent;
  let fixture: ComponentFixture<AdminComplexServicesPageComponent>;
  let facade: ComplexServicesFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComplexServicesPageComponent],
      providers: [ComplexServicesFacadeService, MockComplexServiceRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComplexServicesPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ComplexServicesFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load services on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingService()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingService()).toBeNull();
  });
});
