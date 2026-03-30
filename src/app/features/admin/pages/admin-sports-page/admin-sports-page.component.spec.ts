import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSportsPageComponent } from './admin-sports-page.component';
import { SportsFacadeService } from './sports-facade.service';
import { MockSportRepository } from '../../../../core/repositories/mock/mock-sport.repository';

describe('AdminSportsPageComponent', () => {
  let component: AdminSportsPageComponent;
  let fixture: ComponentFixture<AdminSportsPageComponent>;
  let facade: SportsFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSportsPageComponent],
      providers: [SportsFacadeService, MockSportRepository]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSportsPageComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(SportsFacadeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sports on init', async () => {
    await facade.load();
    expect(facade.entities().length).toBeGreaterThan(0);
  });

  it('should open form panel for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingSport()).toBeNull();
  });

  it('should close form panel', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingSport()).toBeNull();
  });
});
