import { Component, output, inject, OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-terms-dialog',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="terms-overlay" (click)="closed.emit()" (keydown.escape)="closed.emit()">
      <div class="terms-dialog" (click)="$event.stopPropagation()">
        <div class="terms-dialog__header">
          <h2 class="terms-dialog__title">{{ 'terms.title' | t }}</h2>
          <button class="terms-dialog__close" type="button" (click)="closed.emit()" [attr.aria-label]="'common.close' | t">✕</button>
        </div>

        <div class="terms-dialog__body">
          <section class="terms-dialog__section">
            <h3>{{ 'terms.section1.title' | t }}</h3>
            <p>{{ 'terms.section1.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section2.title' | t }}</h3>
            <p>{{ 'terms.section2.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section3.title' | t }}</h3>
            <p>{{ 'terms.section3.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section4.title' | t }}</h3>
            <p>{{ 'terms.section4.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section5.title' | t }}</h3>
            <p>{{ 'terms.section5.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section6.title' | t }}</h3>
            <p>{{ 'terms.section6.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section7.title' | t }}</h3>
            <p>{{ 'terms.section7.text' | t }}</p>
          </section>

          <section class="terms-dialog__section">
            <h3>{{ 'terms.section8.title' | t }}</h3>
            <p>{{ 'terms.section8.text' | t }}</p>
          </section>
        </div>

        <div class="terms-dialog__footer">
          <button class="btn btn--primary btn--full" type="button" (click)="accepted.emit()">
            {{ 'terms.accept' | t }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .terms-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      padding: var(--zh-space-md);
      backdrop-filter: blur(4px);
    }

    .terms-dialog {
      background: var(--zh-surface-card);
      border-radius: var(--zh-radius-lg);
      max-width: 680px;
      width: 100%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--zh-shadow-lg);

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--zh-space-lg) var(--zh-space-xl);
        border-bottom: 1px solid var(--zh-border-subtle);
      }

      &__title {
        margin: 0;
        font-size: var(--zh-font-size-lg);
        font-weight: 700;
        color: var(--zh-text-primary);
      }

      &__close {
        background: none;
        border: none;
        font-size: var(--zh-font-size-lg);
        color: var(--zh-text-muted);
        cursor: pointer;
        padding: var(--zh-space-xs);
        line-height: 1;

        &:hover {
          color: var(--zh-text-primary);
        }
      }

      &__body {
        flex: 1;
        overflow-y: auto;
        padding: var(--zh-space-lg) var(--zh-space-xl);
      }

      &__section {
        margin-bottom: var(--zh-space-lg);

        h3 {
          font-size: var(--zh-font-size-md);
          font-weight: 700;
          color: var(--zh-text-primary);
          margin: 0 0 var(--zh-space-xs);
        }

        p {
          font-size: var(--zh-font-size-sm);
          color: var(--zh-text-secondary);
          line-height: 1.6;
          margin: 0;
        }
      }

      &__footer {
        padding: var(--zh-space-md) var(--zh-space-xl);
        border-top: 1px solid var(--zh-border-subtle);
      }
    }
  `]
})
export class TermsDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);
  readonly closed = output<void>();
  readonly accepted = output<void>();

  ngOnInit(): void {
    this.doc.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = '';
  }
}
