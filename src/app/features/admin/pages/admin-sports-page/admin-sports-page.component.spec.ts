import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSportsPageComponent } from './admin-sports-page.component';
import { SportsFacadeService } from './sports-facade.service';
import { ApiSportRepository } from '../../../../core/repositories/api/api-sport.repository';

describe('AdminSportsPageComponent', () => {
  let component: AdminSportsPageComponent;
  let fixture: ComponentFixture<AdminSportsPageComponent>;
  let facade: SportsFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSportsPageComponent],
      providers: [SportsFacadeService, ApiSportRepository]
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
});
