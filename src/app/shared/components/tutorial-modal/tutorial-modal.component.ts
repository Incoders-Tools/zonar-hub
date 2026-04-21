import { Component, input, output, signal, ElementRef, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-tutorial-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './tutorial-modal.component.html',
  styleUrl: './tutorial-modal.component.scss'
})
export class TutorialModalComponent implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly elRef = inject(ElementRef);

  readonly titleKey = input('tutorial.title');
  readonly videoUrl = input('');
  readonly youtubeUrl = input('');
  readonly htmlContent = input('');
  readonly closed = output<void>();

  readonly minimized = signal(false);
  readonly maximized = signal(false);
  readonly posX = signal(24);
  readonly posY = signal(24);

  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private readonly onMouseMove = (e: MouseEvent) => this.onDragMove(e);
  private readonly onMouseUp = () => this.onDragEnd();

  toggleMinimize(): void {
    this.minimized.update(v => !v);
    if (!this.minimized()) {
      this.maximized.set(false);
    }
  }

  toggleMaximize(): void {
    this.maximized.update(v => !v);
    if (this.maximized()) {
      this.minimized.set(false);
    }
  }

  onDragStart(event: MouseEvent): void {
    if (this.maximized()) return;
    this.dragging = true;
    this.dragOffsetX = event.clientX - this.posX();
    this.dragOffsetY = event.clientY - this.posY();
    this.doc.addEventListener('mousemove', this.onMouseMove);
    this.doc.addEventListener('mouseup', this.onMouseUp);
  }

  private onDragMove(event: MouseEvent): void {
    if (!this.dragging) return;
    const x = Math.max(0, Math.min(event.clientX - this.dragOffsetX, window.innerWidth - 200));
    const y = Math.max(0, Math.min(event.clientY - this.dragOffsetY, window.innerHeight - 40));
    this.posX.set(x);
    this.posY.set(y);
  }

  private onDragEnd(): void {
    this.dragging = false;
    this.doc.removeEventListener('mousemove', this.onMouseMove);
    this.doc.removeEventListener('mouseup', this.onMouseUp);
  }

  ngOnDestroy(): void {
    this.onDragEnd();
  }
}
