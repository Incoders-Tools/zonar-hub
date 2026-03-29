import { Component, output } from '@angular/core';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-category-help-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './category-help-dialog.component.html',
  styleUrl: './category-help-dialog.component.scss'
})
export class CategoryHelpDialogComponent {
  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
