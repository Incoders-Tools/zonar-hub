import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { AdminDrawPlannerPageComponent } from './admin-draw-planner-page.component';
import { ApiTournamentDrawRepository } from '../../../../core/repositories/api/api-tournament-draw.repository';
import { ApiTournamentAdminRepository } from '../../../../core/repositories/api/api-tournament-admin.repository';
import { TournamentService } from '../../../../core/services/tournament.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Tournament, TournamentDraw, TournamentDrawRequest } from '../../../../core/models';
import {
  buildDrawParticipants,
  buildEightPairKnockoutDraw,
  buildKnockoutDraw
} from '../../../../core/models/tournament-draw.testing';

const tournament = {
  id: 't-1', organizationId: 'org-1', name: 'Copa Verano', complexId: 'c-1', complexName: 'Arena', categoryId: '',
  categoryName: '', genderId: '', genderLabel: '', tournamentTypeId: '', tournamentTypeName: '', sportId: 's-1',
  sportName: '', statusId: 'upcoming', statusLabel: '', startDate: '2030-12-01', endDate: '2030-12-03',
  registrationStartDate: '', registrationEndDate: '', maxPairs: 16, description: '', rules: '',
  createdAt: '2026-01-01T00:00:00Z', isActive: true, isPublic: true, modalityKey: 'doubles'
} as Tournament;

function draftDraw(): TournamentDraw {
  const draw = buildKnockoutDraw(4);
  draw.status = 'draft';
  draw.publishedAt = null;
  draw.options = { knockout: { thirdPlaceMatch: true }, scoring: { thirdSetSuperTiebreak: true } };
  draw.participants[1] = { ...draw.participants[1], separationKey: 'Club Norte' };
  return draw;
}

function publishedDraw(): TournamentDraw {
  return { ...draftDraw(), status: 'published', publishedAt: '2026-10-30T12:00:00Z' };
}

function draftWithResults(): TournamentDraw {
  return { ...buildEightPairKnockoutDraw(), status: 'draft', publishedAt: null };
}

const settle = async (fixture: ComponentFixture<unknown>) => {
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }
};

describe('AdminDrawPlannerPageComponent', () => {
  let fixture: ComponentFixture<AdminDrawPlannerPageComponent>;
  let component: AdminDrawPlannerPageComponent;
  let element: HTMLElement;
  let drawRepo: jasmine.SpyObj<ApiTournamentDrawRepository>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let params: BehaviorSubject<ParamMap>;
  let tournamentService: { tournaments: ReturnType<typeof signal<Tournament[]>>; loading: ReturnType<typeof signal<boolean>>; loadTournaments: jasmine.Spy };

  beforeEach(async () => {
    drawRepo = jasmine.createSpyObj<ApiTournamentDrawRepository>('ApiTournamentDrawRepository',
      ['get', 'preview', 'saveDraft', 'publish', 'unpublish', 'delete', 'saveMatchResult']);
    drawRepo.get.and.resolveTo(null);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'warning', 'info']);
    params = new BehaviorSubject(convertToParamMap({ tournamentId: 't-1' }));
    tournamentService = {
      tournaments: signal<Tournament[]>([tournament, { ...tournament, id: 't-2', name: 'Copa Invierno' }]),
      loading: signal(false),
      loadTournaments: jasmine.createSpy('loadTournaments').and.resolveTo()
    };

    await TestBed.configureTestingModule({
      imports: [AdminDrawPlannerPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
        { provide: ApiTournamentDrawRepository, useValue: drawRepo },
        { provide: ApiTournamentAdminRepository, useValue: { getById: jasmine.createSpy('getById').and.resolveTo(tournament) } },
        { provide: TournamentService, useValue: tournamentService },
        { provide: NotificationService, useValue: notifications }
      ]
    }).compileComponents();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(AdminDrawPlannerPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
    await settle(fixture);
  }

  function action(name: string): HTMLButtonElement | null {
    return element.querySelector(`[data-action="${name}"] button, button[data-action="${name}"]`);
  }

  async function click(name: string): Promise<void> {
    const button = action(name);
    if (!button) throw new Error(`${name} action not rendered`);
    button.click();
    await settle(fixture);
  }

  function text(selector: string): string {
    return element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function headers(): string[] {
    return Array.from(element.querySelectorAll('.draw-admin__participants th'))
      .map(th => th.textContent?.replace('*', '').trim() ?? '')
      .filter(Boolean);
  }

  function fillPairs(names: Array<[string, string]>): void {
    component.replaceParticipants(names.map(([a, b]) => ({
      id: null, displayName: `${a} / ${b}`, members: [a, b], seedRank: null, separationKey: null
    })));
    fixture.detectChanges();
  }

  function lastRequest(spy: jasmine.Spy): TournamentDrawRequest {
    return spy.calls.mostRecent().args[1] as TournamentDrawRequest;
  }

  it('loads an existing draft into the form and shows it in the bracket', async () => {
    drawRepo.get.and.resolveTo(draftDraw());
    await render();

    expect(drawRepo.get).toHaveBeenCalledOnceWith('t-1');
    expect(text('.draw-admin__title')).toContain('Copa Verano');
    expect(text('.draw-admin__status')).toBe('Borrador');
    expect(component.participants.length).toBe(4);
    expect(component.form.controls.thirdPlaceMatch.value).toBeTrue();
    expect(text('.draw-admin__count')).toContain('4');
    expect(element.querySelector('.draw-admin__result app-tournament-bracket .match-card')).not.toBeNull();
    expect(action('publish')).not.toBeNull();
    expect(action('unpublish')).toBeNull();
  });

  it('loads a published draw with unpublish available and delete locked', async () => {
    drawRepo.get.and.resolveTo(publishedDraw());
    await render();

    expect(text('.draw-admin__status')).toBe('Publicada');
    expect(action('publish')).toBeNull();
    expect(action('unpublish')?.disabled).toBeFalse();
    expect(action('delete')?.disabled).toBeTrue();
    expect(element.querySelector('[data-hint="unpublish-to-delete"]')).not.toBeNull();
  });

  it('starts empty when the tournament has no draw and explains public visibility', async () => {
    await render();

    expect(text('.draw-admin__status')).toBe('Sin grilla');
    expect(component.participants.length).toBe(0);
    expect(element.querySelector('.draw-admin__result app-tournament-bracket')).toBeNull();
    expect(action('publish')).toBeNull();
    expect(action('preview')?.disabled).toBeTrue();
    expect(element.querySelector('[data-hint="public-visibility"]')).not.toBeNull();
  });

  it('blocks the preview while the participant list is invalid', async () => {
    await render();
    fillPairs([['Ana', 'Bea'], ['ana', 'bea']]);

    expect(action('preview')?.disabled).toBeTrue();
    expect(text('.draw-admin__issues')).toContain('Fila 2');
    action('preview')?.click();
    await settle(fixture);
    expect(drawRepo.preview).not.toHaveBeenCalled();
  });

  it('previews the draw with the D5 request and shows separation conflicts', async () => {
    const preview: TournamentDraw = {
      ...draftDraw(),
      separationConflicts: [{ key: 'Club Norte', participantIds: ['p1', 'p2'], kind: 'firstRoundMatch', locationId: 'KO-R1-M1' }]
    };
    drawRepo.preview.and.resolveTo(preview);
    await render();
    fillPairs([['Ana', 'Bea'], ['Caro', 'Dani'], ['Eva', 'Flor']]);
    component.participants.at(0).patchValue({ seedRank: 1, separationKey: 'Club Norte' });
    component.form.patchValue({ thirdPlaceMatch: true });
    fixture.detectChanges();

    await click('preview');

    expect(drawRepo.preview).toHaveBeenCalledTimes(1);
    const body = lastRequest(drawRepo.preview);
    expect(drawRepo.preview.calls.mostRecent().args[0]).toBe('t-1');
    expect(body.format).toBe('singleElimination');
    expect(body.participationFormat).toBe('pair');
    expect(body.randomization).toEqual({ mode: 'seeded' });
    expect(body.options).toEqual({ knockout: { thirdPlaceMatch: true }, scoring: { thirdSetSuperTiebreak: true } });
    expect(body.participants[0]).toEqual({
      id: 'p1', displayName: 'Ana / Bea', members: ['Ana', 'Bea'], seedRank: 1, separationKey: 'Club Norte'
    });
    expect(element.querySelector('.draw-admin__result app-tournament-bracket .match-card')).not.toBeNull();
    expect(text('.draw-admin__conflicts')).toContain('Club Norte');
    expect(text('.draw-admin__result-label')).toBe('Vista previa sin guardar');
  });

  it('saves the draft and updates the state', async () => {
    drawRepo.saveDraft.and.resolveTo(draftDraw());
    await render();
    fillPairs([['Ana', 'Bea'], ['Caro', 'Dani']]);
    component.form.patchValue({ seed: '12345' });
    fixture.detectChanges();

    await click('save');

    expect(drawRepo.saveDraft).toHaveBeenCalledTimes(1);
    expect(lastRequest(drawRepo.saveDraft).randomization).toEqual({ mode: 'seeded', seed: '12345' });
    expect(text('.draw-admin__status')).toBe('Borrador');
    expect(notifications.success).toHaveBeenCalledWith('adminDraw.messages.saved');
    expect(action('publish')?.disabled).toBeFalse();
  });

  it('publishes and unpublishes through the repository', async () => {
    drawRepo.get.and.resolveTo(draftDraw());
    drawRepo.publish.and.resolveTo(publishedDraw());
    drawRepo.unpublish.and.resolveTo(draftDraw());
    await render();

    await click('publish');
    expect(drawRepo.publish).toHaveBeenCalledOnceWith('t-1');
    expect(text('.draw-admin__status')).toBe('Publicada');
    expect(notifications.success).toHaveBeenCalledWith('adminDraw.messages.published');

    await click('unpublish');
    expect(drawRepo.unpublish).toHaveBeenCalledOnceWith('t-1');
    expect(text('.draw-admin__status')).toBe('Borrador');
  });

  it('deletes the draft only after confirmation', async () => {
    drawRepo.get.and.resolveTo(draftDraw());
    drawRepo.delete.and.resolveTo();
    await render();

    await click('delete');
    expect(element.querySelector('app-confirm-dialog')).not.toBeNull();
    (element.querySelector('.confirm-dialog__cancel') as HTMLButtonElement).click();
    await settle(fixture);
    expect(drawRepo.delete).not.toHaveBeenCalled();

    await click('delete');
    (element.querySelector('app-confirm-dialog app-async-button button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(drawRepo.delete).toHaveBeenCalledOnceWith('t-1');
    expect(text('.draw-admin__status')).toBe('Sin grilla');
    expect(notifications.success).toHaveBeenCalledWith('adminDraw.messages.deleted');
    expect(component.participants.length).toBe(4);
  });

  it('locks regenerate, save and delete when matches have results', async () => {
    drawRepo.get.and.resolveTo(draftWithResults());
    await render();

    expect(action('regenerate')?.disabled).toBeTrue();
    expect(action('save')?.disabled).toBeTrue();
    expect(action('delete')?.disabled).toBeTrue();
    expect(element.querySelector('[data-hint="results-lock"]')).not.toBeNull();
  });

  it('regenerates with a fresh seed when the draft has no results', async () => {
    drawRepo.get.and.resolveTo({ ...draftDraw(), seed: '777' });
    drawRepo.preview.and.resolveTo(draftDraw());
    await render();
    expect(component.form.controls.seed.value).toBe('777');

    await click('regenerate');

    expect(lastRequest(drawRepo.preview).randomization).toEqual({ mode: 'seeded' });
    expect(component.form.controls.seed.value).toBe('20261031');
  });

  it('shows the API error key when an action fails', async () => {
    drawRepo.saveDraft.and.rejectWith(new Error('draws.errors.results_exist'));
    await render();
    fillPairs([['Ana', 'Bea'], ['Caro', 'Dani']]);

    await click('save');

    expect(notifications.error).toHaveBeenCalledWith('draws.errors.results_exist');
    expect(text('.draw-admin__status')).toBe('Sin grilla');
  });

  it('changes the member inputs with the participation format', async () => {
    await render();
    fillPairs([['Ana', 'Bea'], ['Caro', 'Dani']]);
    expect(headers()).toEqual(['Jugador 1', 'Jugador 2', 'Nombre visible (opcional)', 'Cabeza de serie', 'Club']);
    expect(element.querySelectorAll('.draw-admin__participants tbody tr:first-child input').length).toBe(5);

    component.form.controls.participationFormat.setValue('individual');
    fixture.detectChanges();
    expect(headers()).toEqual(['Jugador', 'Cabeza de serie', 'Club']);
    expect(element.querySelectorAll('.draw-admin__participants tbody tr:first-child input').length).toBe(3);

    component.form.controls.participationFormat.setValue('team');
    fixture.detectChanges();
    expect(headers()).toEqual(['Equipo', 'Integrantes (separados por /)', 'Cabeza de serie', 'Club']);
  });

  it('defaults the participation format from the tournament modality', async () => {
    const tournamentRepo = TestBed.inject(ApiTournamentAdminRepository) as unknown as { getById: jasmine.Spy };
    tournamentRepo.getById.and.resolveTo({ ...tournament, modalityKey: 'single' });
    await render();

    expect(component.form.controls.participationFormat.value).toBe('individual');
  });

  it('checks a pasted list and replaces the participants', async () => {
    await render();
    component.pasteControl.setValue('Ana / Bea [1] #Norte\nCaro / Dani\nEva');
    fixture.detectChanges();

    await click('paste-check');
    expect(text('.draw-admin__paste-issues')).toContain('Línea 3');
    expect(action('paste-replace')?.disabled).toBeTrue();

    component.pasteControl.setValue('Ana / Bea [1] #Norte\nCaro / Dani');
    fixture.detectChanges();
    await click('paste-check');
    expect(element.querySelectorAll('.draw-admin__paste-preview li').length).toBe(2);

    await click('paste-replace');
    expect(component.participants.length).toBe(2);
    expect(component.participants.at(0).value).toEqual(jasmine.objectContaining({
      member1: 'Ana', member2: 'Bea', seedRank: 1, separationKey: 'Norte'
    }));
    expect(text('.draw-admin__count')).toContain('2');
  });

  it('acts as a tournament picker without a tournament id', async () => {
    params.next(convertToParamMap({}));
    await render();
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    expect(tournamentService.loadTournaments).toHaveBeenCalled();
    expect(drawRepo.get).not.toHaveBeenCalled();
    component.pickerControl.setValue('t-2');

    expect(navigate).toHaveBeenCalledOnceWith(['/admin/tournaments', 't-2', 'draw']);
  });

  it('shows the error state when the draw cannot be loaded', async () => {
    drawRepo.get.and.rejectWith(new Error('tournaments.errors.forbidden'));
    await render();

    expect(element.querySelector('app-error-state')).not.toBeNull();
    expect(text('app-error-state')).toContain('No tiene acceso a los torneos');
  });

  it('keeps participant ids of a loaded draw in the request', async () => {
    const draw = draftDraw();
    draw.participants = buildDrawParticipants(2).map((participant, index) => ({ ...participant, id: `x${index}` }));
    drawRepo.get.and.resolveTo(draw);
    drawRepo.preview.and.resolveTo(draw);
    await render();

    await click('preview');

    expect(lastRequest(drawRepo.preview).participants.map(participant => participant.id)).toEqual(['x0', 'x1']);
  });
});
