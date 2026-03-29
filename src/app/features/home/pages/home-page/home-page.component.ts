import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { ContentService } from '../../../../core/services/content.service';

interface SportCard {
  icon: string;
  labelKey: string;
}

interface FeatureCard {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  protected readonly tournamentService = inject(TournamentService);
  protected readonly contentService = inject(ContentService);

  readonly sports: SportCard[] = [
    { icon: '🏓', labelKey: 'home.sport.padel' },
    { icon: '🎾', labelKey: 'home.sport.tennis' },
    { icon: '⚽', labelKey: 'home.sport.football' },
    { icon: '🏐', labelKey: 'home.sport.volleyball' }
  ];

  readonly features: FeatureCard[] = [
    { icon: '📝', titleKey: 'home.card.one.title', descriptionKey: 'home.card.one.description' },
    { icon: '⚙️', titleKey: 'home.card.two.title', descriptionKey: 'home.card.two.description' },
    { icon: '📊', titleKey: 'home.card.three.title', descriptionKey: 'home.card.three.description' },
    { icon: '🏆', titleKey: 'home.card.four.title', descriptionKey: 'home.card.four.description' }
  ];

  ngOnInit(): void {
    this.tournamentService.loadTournaments();
  }
}