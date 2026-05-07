import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminTournamentStatusesPageComponent } from './admin-tournament-statuses-page.component';
import { TournamentStatusesFacadeService } from './tournament-statuses-facade.service';
import { ApiTournamentStatusRepository } from '../../../../core/repositories/api/api-tournament-status.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';

describe('AdminTournamentStatusesPageComponent', () => {
  let component: AdminTournamentStatusesPageComponent;
  let fixture: ComponentFixture<AdminTournamentStatusesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTournamentStatusesPageComponent],
      providers: [
        TournamentStatusesFacadeService,
        ApiTournamentStatusRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTournamentStatusesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open form dialog for create', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingStatus()).toBeNull();
  });

  it('should close form dialog', () => {
    component.showFormPanel.set(true);
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
    expect(component.editingStatus()).toBeNull();
  });
});
