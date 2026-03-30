import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSocialNetworksPageComponent } from './admin-social-networks-page.component';
import { SocialNetworksFacadeService } from './social-networks-facade.service';
import { MockSocialNetworkRepository } from '../../../../core/repositories/mock/mock-social-network.repository';

describe('AdminSocialNetworksPageComponent', () => {
  let component: AdminSocialNetworksPageComponent;
  let fixture: ComponentFixture<AdminSocialNetworksPageComponent>;
  let facade: SocialNetworksFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSocialNetworksPageComponent],
      providers: [SocialNetworksFacadeService, MockSocialNetworkRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSocialNetworksPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(SocialNetworksFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load networks on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormDialog()).toBe(true);
    expect(component.editingNetwork()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormDialog.set(true);
    component.closeFormDialog();
    expect(component.showFormDialog()).toBe(false);
    expect(component.editingNetwork()).toBeNull();
  });

  it('should filter networks by name', async () => {
    await facade.load();
    facade.applyFilters({ name: 'Instagram' });
    expect(facade.filteredNetworks().length).toBeGreaterThan(0);
  });
});
