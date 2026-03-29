import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { TournamentBracket, BracketMatch } from '../../../core/models';

@Component({
  selector: 'app-tournament-bracket',
  standalone: true,
  imports: [TranslatePipe, MatIcon],
  templateUrl: './tournament-bracket.component.html',
  styleUrl: './tournament-bracket.component.scss'
})
export class TournamentBracketComponent {
  readonly bracket = input.required<TournamentBracket>();

  isWinner(match: BracketMatch, pairId: string | undefined): boolean {
    return match.winnerId != null && match.winnerId === pairId;
  }

  isLoser(match: BracketMatch, pairId: string | undefined): boolean {
    return match.winnerId != null && match.winnerId !== pairId;
  }
}
