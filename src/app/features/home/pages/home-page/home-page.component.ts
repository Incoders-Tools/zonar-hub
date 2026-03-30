import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';

interface SportCard {
  icon: string;
  labelKey: string;
}

interface FeatureCard {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

interface WorkflowStep {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface FaqItem {
  questionKey: string;
  answerKey: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, FormatDatePipe, TutorialModalComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  protected readonly tournamentService = inject(TournamentService);
  readonly showTutorial = signal(false);
  readonly expandedFaq = signal<number | null>(null);
  readonly billingCycle = signal<'monthly' | 'annual'>('monthly');

  readonly sports: SportCard[] = [
    { icon: '🎾', labelKey: 'home.sport.padel' },
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

  readonly workflowSteps: WorkflowStep[] = [
    { icon: '🏗️', titleKey: 'home.workflow.step1.title', descKey: 'home.workflow.step1.desc' },
    { icon: '📝', titleKey: 'home.workflow.step2.title', descKey: 'home.workflow.step2.desc' },
    { icon: '🎲', titleKey: 'home.workflow.step3.title', descKey: 'home.workflow.step3.desc' },
    { icon: '🤖', titleKey: 'home.workflow.step4.title', descKey: 'home.workflow.step4.desc' },
    { icon: '🏆', titleKey: 'home.workflow.step5.title', descKey: 'home.workflow.step5.desc' }
  ];

  readonly faqItems: FaqItem[] = [
    { questionKey: 'home.faq.q1', answerKey: 'home.faq.a1' },
    { questionKey: 'home.faq.q2', answerKey: 'home.faq.a2' },
    { questionKey: 'home.faq.q3', answerKey: 'home.faq.a3' },
    { questionKey: 'home.faq.q4', answerKey: 'home.faq.a4' },
    { questionKey: 'home.faq.q5', answerKey: 'home.faq.a5' },
    { questionKey: 'home.faq.q6', answerKey: 'home.faq.a6' }
  ];

  ngOnInit(): void {
    this.tournamentService.loadTournaments();
  }

  toggleFaq(index: number): void {
    this.expandedFaq.update(current => current === index ? null : index);
  }
}