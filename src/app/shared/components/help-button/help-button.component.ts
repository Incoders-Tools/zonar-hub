import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface HelpSection {
  titleKey: string;
  contentKey?: string;
  items?: string[];
}

@Component({
  selector: 'app-help-button',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './help-button.component.html',
  styleUrl: './help-button.component.scss'
})
export class HelpButtonComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly titleKey = input.required<string>();
  readonly sections = input.required<HelpSection[]>();
  readonly videoUrl = input<string | undefined>(undefined);

  readonly isOpen = signal(false);
  readonly activeTab = signal<'docs' | 'video'>('docs');

  readonly safeVideoUrl = computed(() => {
    const url = this.videoUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  open(): void {
    this.activeTab.set('docs');
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
