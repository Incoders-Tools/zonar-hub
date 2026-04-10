import { Component, input, output, signal, computed, OnDestroy, AfterViewInit } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface TourStep {
  targetSelector: string;
  titleKey: string;
  descriptionKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss'
})
export class GuidedTourComponent implements OnDestroy, AfterViewInit {
  readonly steps = input.required<TourStep[]>();
  readonly initialStep = input(0);

  readonly stepChanged = output<number>();
  readonly completed = output<void>();
  readonly cancelled = output<void>();

  readonly currentStep = signal(0);
  readonly targetRect = signal<DOMRect | null>(null);
  readonly visible = signal(false);

  readonly totalSteps = computed(() => this.steps().length);
  readonly activeStep = computed(() => this.steps()[this.currentStep()] ?? null);
  readonly stepLabel = computed(() => `${this.currentStep() + 1}/${this.totalSteps()}`);
  readonly isFirst = computed(() => this.currentStep() === 0);
  readonly isLast = computed(() => this.currentStep() === this.totalSteps() - 1);

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.start();
  }

  start(): void {
    this.currentStep.set(this.initialStep());
    this.visible.set(true);
    this.highlightTarget();
  }

  next(): void {
    if (this.isLast()) {
      this.finish();
      return;
    }
    const nextIdx = this.currentStep() + 1;
    this.currentStep.set(nextIdx);
    this.stepChanged.emit(nextIdx);
    this.highlightTarget();
  }

  prev(): void {
    if (this.isFirst()) return;
    const prevIdx = this.currentStep() - 1;
    this.currentStep.set(prevIdx);
    this.stepChanged.emit(prevIdx);
    this.highlightTarget();
  }

  cancel(): void {
    this.cleanup();
    this.visible.set(false);
    this.cancelled.emit();
  }

  private finish(): void {
    this.cleanup();
    this.visible.set(false);
    this.completed.emit();
  }

  private highlightTarget(): void {
    const step = this.activeStep();
    if (!step) return;

    requestAnimationFrame(() => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        this.targetRect.set(rect);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.cleanupObserver();
        this.resizeObserver = new ResizeObserver(() => {
          const updated = el.getBoundingClientRect();
          this.targetRect.set(updated);
        });
        this.resizeObserver.observe(el);
      } else {
        this.targetRect.set(null);
      }
    });
  }

  private cleanup(): void {
    this.cleanupObserver();
  }

  private cleanupObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  getTooltipTop(): number {
    const rect = this.targetRect();
    const step = this.activeStep();
    if (!rect) return 100;
    const pos = step?.position ?? 'bottom';
    switch (pos) {
      case 'top': return rect.top - 200;
      case 'left':
      case 'right': return rect.top + rect.height / 2 - 80;
      default: return rect.bottom + 16;
    }
  }

  getTooltipLeft(): number {
    const rect = this.targetRect();
    const step = this.activeStep();
    if (!rect) return 100;
    const pos = step?.position ?? 'bottom';
    switch (pos) {
      case 'left': return rect.left - 400;
      case 'right': return rect.right + 16;
      default: return Math.max(16, rect.left + rect.width / 2 - 190);
    }
  }
}
