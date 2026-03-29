import { Component, input, output, computed } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface StepperStep {
  labelKey: string;
  completed?: boolean;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss'
})
export class StepperComponent {
  readonly steps = input.required<StepperStep[]>();
  readonly activeIndex = input(0);
  readonly linear = input(true);
  readonly stepChanged = output<number>();

  canNavigateTo(index: number): boolean {
    if (!this.linear()) return true;
    if (index <= this.activeIndex()) return true;
    const steps = this.steps();
    for (let i = 0; i < index; i++) {
      if (!steps[i].completed) return false;
    }
    return true;
  }

  selectStep(index: number): void {
    if (this.canNavigateTo(index)) {
      this.stepChanged.emit(index);
    }
  }
}
