import { Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss'
})
export class LoadingStateComponent {
  readonly showMessage = input(true);
  readonly messageKey = input('state.loading');
}
