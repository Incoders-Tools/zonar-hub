import { Injectable, inject, signal, effect } from '@angular/core';
import { ApiSportRepository } from '../repositories/api/api-sport.repository';
import { ApiTournamentModalityRepository } from '../repositories/api/api-tournament-modality.repository';
import { ActiveOrganizationService } from './active-organization.service';

@Injectable({ providedIn: 'root' })
export class SportContextService {
  private readonly sportRepo = inject(ApiSportRepository);
  private readonly modalityRepo = inject(ApiTournamentModalityRepository);
  private readonly activeOrg = inject(ActiveOrganizationService);

  readonly hasTeamModality = signal(false);

  constructor() {
    effect(() => {
      this.activeOrg.organizationChanged();
      void this.checkTeamModality();
    });
  }

  private async checkTeamModality(): Promise<void> {
    try {
      const [sports, modalities] = await Promise.all([
        this.sportRepo.getAll(),
        this.modalityRepo.getAll()
      ]);

      const teamModalityId = modalities.find(m => m.key === 'teams')?.id;
      if (!teamModalityId) {
        this.hasTeamModality.set(false);
        return;
      }

      const hasTeam = sports.some(s => s.isActive && s.modalityIds.includes(teamModalityId));
      this.hasTeamModality.set(hasTeam);
    } catch {
      this.hasTeamModality.set(false);
    }
  }
}
