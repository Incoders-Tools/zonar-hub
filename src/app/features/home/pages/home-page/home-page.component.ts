import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';
import { ChatbotBubbleComponent } from '../../../../shared/components/chatbot-bubble/chatbot-bubble.component';
import { PlansPricingComponent } from '../../../../shared/components/plans-pricing/plans-pricing.component';
import { MOCK_TOURNAMENTS } from '../../../../core/data/mock/mock-tournaments';
import { Tournament } from '../../../../core/models';

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
  imports: [RouterLink, TranslatePipe, FormatDatePipe, TutorialModalComponent, ChatbotBubbleComponent, PlansPricingComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  protected readonly tournamentService = inject(TournamentService);
  readonly showTutorial = signal(false);

  readonly sports = [
    { id: '1c65fdf8-76fc-4a91-a2b5-1d70791bfde1', key: 'padel',  icon: '🎾' },
    { id: 'f57e77a7-24ba-4fd3-a0d3-0b89df6222d2', key: 'tenis',  icon: '🎾' },
    { id: '293aabec-31db-4f5a-9e22-8eb218f4d11a', key: 'futbol', icon: '⚽' },
    { id: '725d42b7-2298-4f55-acf4-4ab99f910fd2', key: 'rugby',  icon: '🏉' },
  ] as const;
  readonly expandedFaq = signal<number | null>(null);
  readonly billingCycle = signal<'monthly' | 'annual'>('monthly');
  readonly selectedPlan = signal<'starter' | 'pro' | 'enterprise'>('pro');

  // Pricing constants
  readonly starterMonthly = 49;
  readonly proMonthly = 97;
  readonly starterAnnual = computed(() => Math.round(this.starterMonthly * 12 * 0.8));
  readonly proAnnual = computed(() => Math.round(this.proMonthly * 12 * 0.8));

  /** Showcase tournaments for the public landing page: always include mock upcoming + user-created */
  private readonly mockUpcoming: Tournament[] = MOCK_TOURNAMENTS.filter(t => ['ts1', 'ts2'].includes(t.statusId));
  readonly showcaseTournaments = computed(() => {
    const userTournaments = this.tournamentService.upcomingTournaments();
    const mockIds = new Set(this.mockUpcoming.map(t => t.id));
    const userOnly = userTournaments.filter(t => !mockIds.has(t.id));
    return [...this.mockUpcoming, ...userOnly];
  });

  readonly features: FeatureCard[] = [
    { icon: '📝', titleKey: 'home.card.one.title', descriptionKey: 'home.card.one.description' },
    { icon: '⚙️', titleKey: 'home.card.two.title', descriptionKey: 'home.card.two.description' },
    { icon: '📊', titleKey: 'home.card.three.title', descriptionKey: 'home.card.three.description' },
    { icon: '📲', titleKey: 'home.card.four.title', descriptionKey: 'home.card.four.description' }
  ];

  readonly originTypes: FeatureCard[] = [
    { icon: '🏅', titleKey: 'home.origins.circuito.title', descriptionKey: 'home.origins.circuito.description' },
    { icon: '🎯', titleKey: 'home.origins.operadora.title', descriptionKey: 'home.origins.operadora.description' },
    { icon: '🎓', titleKey: 'home.origins.academia.title', descriptionKey: 'home.origins.academia.description' },
    { icon: '🏢', titleKey: 'home.origins.organizacion.title', descriptionKey: 'home.origins.organizacion.description' }
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

  selectPlan(plan: 'starter' | 'pro' | 'enterprise'): void {
    this.selectedPlan.set(plan);
  }
}