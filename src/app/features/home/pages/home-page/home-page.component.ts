import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PublicTournamentService } from '../../../../core/services/public-tournament.service';
import { PUBLIC_TOURNAMENTS_ROUTE } from '../../../../core/services/public-tournament-link.service';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';
import { ChatbotBubbleComponent } from '../../../../shared/components/chatbot-bubble/chatbot-bubble.component';
import { PlansPricingComponent } from '../../../../shared/components/plans-pricing/plans-pricing.component';
import { SportIconComponent } from '../../../../shared/components/sport-icon/sport-icon.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { PublicTournamentCardComponent } from '../../../tournaments/components/public-tournament-card/public-tournament-card.component';

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
  imports: [
    RouterLink, TranslatePipe, TutorialModalComponent, ChatbotBubbleComponent, PlansPricingComponent, SportIconComponent,
    LoadingStateComponent, EmptyStateComponent, ErrorStateComponent, PublicTournamentCardComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  private static readonly SHOWCASE_LIMIT = 6;

  protected readonly publicTournaments = inject(PublicTournamentService);
  readonly tournamentsPath = `/${PUBLIC_TOURNAMENTS_ROUTE}`;
  readonly showTutorial = signal(false);

  readonly sports = [
    { id: '1c65fdf8-76fc-4a91-a2b5-1d70791bfde1', key: 'padel',  icon: 'padel', iconSource: 'svg' },
    { id: 'f57e77a7-24ba-4fd3-a0d3-0b89df6222d2', key: 'tenis',  icon: '🎾',    iconSource: 'unicode' },
    { id: '293aabec-31db-4f5a-9e22-8eb218f4d11a', key: 'futbol', icon: '⚽',    iconSource: 'unicode' },
    { id: '725d42b7-2298-4f55-acf4-4ab99f910fd2', key: 'rugby',  icon: '🏉',    iconSource: 'unicode' },
  ] as const;
  readonly expandedFaq = signal<number | null>(null);
  readonly billingCycle = signal<'monthly' | 'annual'>('monthly');
  readonly selectedPlan = signal<'starter' | 'pro' | 'enterprise'>('pro');

  // Pricing constants
  readonly starterMonthly = 49;
  readonly proMonthly = 97;
  readonly starterAnnual = computed(() => Math.round(this.starterMonthly * 12 * 0.8));
  readonly proAnnual = computed(() => Math.round(this.proMonthly * 12 * 0.8));

  /** Upcoming tournaments that organizations made public, read anonymously from the public API.
   *  The landing shows the first few; the full list lives at `/tournaments`. */
  readonly showcaseTournaments = computed(() =>
    this.publicTournaments.upcomingTournaments().slice(0, HomePageComponent.SHOWCASE_LIMIT)
  );

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
    this.loadShowcase();
  }

  loadShowcase(): void {
    void this.publicTournaments.load();
  }

  toggleFaq(index: number): void {
    this.expandedFaq.update(current => current === index ? null : index);
  }

  selectPlan(plan: 'starter' | 'pro' | 'enterprise'): void {
    this.selectedPlan.set(plan);
  }
}