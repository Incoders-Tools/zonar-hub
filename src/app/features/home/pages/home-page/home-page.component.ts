import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TournamentService } from '../../../../core/services/tournament.service';
import { SportService } from '../../../../core/services/sport.service';
import { TutorialModalComponent } from '../../../../shared/components/tutorial-modal/tutorial-modal.component';

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
  protected readonly sportService = inject(SportService);
  readonly showTutorial = signal(false);
  readonly expandedFaq = signal<number | null>(null);
  readonly billingCycle = signal<'monthly' | 'annual'>('monthly');
  readonly selectedPlan = signal<'starter' | 'pro' | 'enterprise'>('pro');

  // Pricing constants
  readonly starterMonthly = 49;
  readonly proMonthly = 97;
  readonly starterAnnual = computed(() => Math.round(this.starterMonthly * 12 * 0.8));
  readonly proAnnual = computed(() => Math.round(this.proMonthly * 12 * 0.8));

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
    this.sportService.loadSports();
  }

  toggleFaq(index: number): void {
    this.expandedFaq.update(current => current === index ? null : index);
  }

  selectPlan(plan: 'starter' | 'pro' | 'enterprise'): void {
    this.selectedPlan.set(plan);
  }
}