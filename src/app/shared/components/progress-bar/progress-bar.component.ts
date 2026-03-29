import { Component, input, computed } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  readonly progress = input(0);
  readonly titleKey = input('');
  readonly messageKey = input('');
  readonly stageLabel = input('');
  readonly showPercentage = input(true);

  readonly clampedProgress = computed(() =>
    Math.min(100, Math.max(0, Math.round(this.progress())))
  );
}
