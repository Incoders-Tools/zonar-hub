import { Component, input, output, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './tutorial-modal.component.html',
  styleUrl: './tutorial-modal.component.scss'
})
export class TutorialModalComponent {
  readonly titleKey = input('tutorial.title');
  readonly videoUrl = input('');
  readonly youtubeUrl = input('');
  readonly htmlContent = input('');
  readonly closed = output<void>();

  readonly minimized = signal(false);

  toggleMinimize(): void {
    this.minimized.update(v => !v);
  }
}
