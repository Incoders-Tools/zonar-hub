import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-loader-overlay',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './loader-overlay.component.html',
  styleUrl: './loader-overlay.component.scss'
})
export class LoaderOverlayComponent {}
