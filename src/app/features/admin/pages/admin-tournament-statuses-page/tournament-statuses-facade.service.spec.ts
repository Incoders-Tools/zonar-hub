import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentStatusesFacadeService } from './tournament-statuses-facade.service';
import { ApiTournamentStatusRepository } from '../../../../core/repositories/api/api-tournament-status.repository';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';

describe('TournamentStatusesFacadeService', () => {
  let service: TournamentStatusesFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TournamentStatusesFacadeService,
        ApiTournamentStatusRepository,
        { provide: API_BASE_URL, useValue: 'http://localhost/api' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TournamentStatusesFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should apply filters', () => {
    service.applyFilters({ name: 'test' });
    expect(service.filteredStatuses()).toBeTruthy();
  });

  it('should clear filters', () => {
    service.clearFilters();
    expect(service.filteredStatuses()).toBeTruthy();
  });

  it('should apply sort option', () => {
    service.applySortOption('name_asc');
    expect(service.filteredStatuses()).toBeTruthy();
  });
});
