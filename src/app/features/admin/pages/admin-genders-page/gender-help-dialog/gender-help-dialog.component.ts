import { Component, output } from '@angular/core';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-gender-help-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './gender-help-dialog.component.html',
  styleUrl: './gender-help-dialog.component.scss'
})
export class GenderHelpDialogComponent {
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
