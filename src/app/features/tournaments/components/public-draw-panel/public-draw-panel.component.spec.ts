import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TournamentDraw } from '../../../../core/models/tournament-draw.model';
import { buildEightPairKnockoutDraw } from '../../../../core/models/tournament-draw.testing';
import { PublicDrawLiveService, PublicDrawLiveState } from '../../../../core/services/public-draw-live.service';
import { DrawViewMode } from '../../../../shared/components/tournament-bracket/tournament-bracket.component';
import { PublicDrawPanelComponent } from './public-draw-panel.component';

class FakeLiveService {
  readonly state = signal<PublicDrawLiveState>('loading');
  readonly draw = signal<TournamentDraw | null>(null);
  readonly errorKey = signal<string | null>(null);
  readonly refreshErrorKey = signal<string | null>(null);
  readonly updatedAt = signal<Date | null>(null);
  readonly refreshing = signal(false);
  retries = 0;
  retry(): void {
    this.retries++;
  }
}

@Component({
  standalone: true,
  imports: [PublicDrawPanelComponent],
  template: `<app-public-draw-panel [mode]="mode()"><p class="host-empty">No draw yet</p></app-public-draw-panel>`
})
class HostComponent {
  readonly mode = signal<DrawViewMode>('bracket');
}

describe('PublicDrawPanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;
  let live: FakeLiveService;

  const text = (selector: string) => element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  beforeEach(async () => {
    live = new FakeLiveService();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PublicDrawLiveService, useValue: live }]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('es');
    fixture = TestBed.createComponent(HostComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('shows the shared loading state during the first load', () => {
    expect(text('app-loading-state')).toContain('Cargando el cuadro');
    expect(element.querySelector('.host-empty')).toBeNull();
  });

  it('shows the error state of a failed first load and retries through the live service', () => {
    live.state.set('error');
    live.errorKey.set('common.networkUnavailable');
    fixture.detectChanges();

    expect(text('app-error-state')).toContain('No pudimos cargar el cuadro');
    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    expect(live.retries).toBe(1);
  });

  it('projects the host empty content when there is no published draw', () => {
    live.state.set('loaded');
    fixture.detectChanges();

    expect(text('.host-empty')).toBe('No draw yet');
    expect(element.querySelector('app-tournament-bracket')).toBeNull();
    expect(element.querySelector('.public-draw-panel__updated')).toBeNull();
  });

  it('renders the draw with the updated-at time and no refresh note', () => {
    live.state.set('loaded');
    live.draw.set(buildEightPairKnockoutDraw());
    live.updatedAt.set(new Date(2026, 10, 1, 9, 7));
    fixture.detectChanges();

    expect(element.querySelector('app-tournament-bracket')).not.toBeNull();
    expect(element.querySelector('.host-empty')).toBeNull();
    expect(text('.public-draw-panel__updated')).toBe('Actualizado a las 09:07');
    expect(element.querySelector('.public-draw-panel__refresh-error')).toBeNull();
  });

  it('shows the refresh note with a retry that is disabled while a refresh runs', () => {
    live.state.set('loaded');
    live.draw.set(buildEightPairKnockoutDraw());
    live.refreshErrorKey.set('common.networkUnavailable');
    fixture.detectChanges();

    expect(element.querySelector('.public-draw-panel__refresh-error')?.getAttribute('role')).toBe('status');
    expect(text('.public-draw-panel__refresh-error')).toContain('No pudimos actualizar el cuadro');
    const retry = element.querySelector<HTMLButtonElement>('.public-draw-panel__retry')!;
    retry.click();
    expect(live.retries).toBe(1);

    live.refreshing.set(true);
    fixture.detectChanges();
    expect(retry.disabled).toBeTrue();
  });

  it('applies the requested view mode to the bracket', () => {
    live.state.set('loaded');
    live.draw.set(buildEightPairKnockoutDraw());
    fixture.componentInstance.mode.set('list');
    fixture.detectChanges();

    const buttons = element.querySelectorAll<HTMLButtonElement>('.draw-view__mode-btn');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
