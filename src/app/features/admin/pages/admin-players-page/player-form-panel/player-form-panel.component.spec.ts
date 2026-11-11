import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { PlayerFormPanelComponent } from './player-form-panel.component';
import { PlayerFacadeService } from '../player-facade.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { Player } from '../../../../../core/models';

const stored: Player = {
  id: 'p1', firstName: 'Ana', lastName: 'Gil', email: 'ana@club.test', documentId: '301', genderId: 'g-f', genderLabel: '',
  categoryId: 'c-4', categoryName: '', birthDate: '1990-05-20', club: 'Norte', isActive: true, createdAt: ''
};

describe('PlayerFormPanelComponent', () => {
  let component: PlayerFormPanelComponent;
  let fixture: ComponentFixture<PlayerFormPanelComponent>;
  let facadeSpy: jasmine.SpyObj<PlayerFacadeService>;

  async function render(player: Player | null): Promise<void> {
    facadeSpy = jasmine.createSpyObj('PlayerFacadeService', ['save'], { saving: signal(false) });
    facadeSpy.save.and.resolveTo(true);
    await TestBed.configureTestingModule({
      imports: [PlayerFormPanelComponent],
      providers: [I18nService, provideNoopAnimations(), { provide: PlayerFacadeService, useValue: facadeSpy }]
    }).compileComponents();
    fixture = TestBed.createComponent(PlayerFormPanelComponent);
    fixture.componentRef.setInput('player', player);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => render(null));

    it('needs only first and last name: email, gender, category and birth date are optional', () => {
      expect(component.canSubmit).toBeFalse();
      component.form.patchValue({ firstName: 'Ana', lastName: 'Gil' });
      expect(component.canSubmit).toBeTrue();
    });

    it('rejects an invalid email and fields over the API limits', () => {
      component.form.patchValue({ firstName: 'Ana', lastName: 'Gil', email: 'not-an-email' });
      expect(component.canSubmit).toBeFalse();
      component.form.patchValue({ email: '', documentId: 'x'.repeat(41) });
      expect(component.canSubmit).toBeFalse();
      component.form.patchValue({ documentId: '', club: 'x'.repeat(121) });
      expect(component.canSubmit).toBeFalse();
    });

    it('shows the missing-data eligibility hint and hides the status toggle', () => {
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('.player-form__eligibility-hint')).not.toBeNull();
      expect(host.querySelector('app-active-toggle')).toBeNull();
    });

    it('saves the API fields, always active, and emits saved', async () => {
      spyOn(component.saved, 'emit');
      component.form.patchValue({ firstName: 'Ana', lastName: 'Gil', club: 'Norte', isActive: false });
      await component.onSubmit();
      expect(facadeSpy.save).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        firstName: 'Ana', lastName: 'Gil', club: 'Norte', email: '', genderId: '', categoryId: '', isActive: true
      }), undefined);
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('does not emit saved when the save fails', async () => {
      facadeSpy.save.and.resolveTo(false);
      spyOn(component.saved, 'emit');
      component.form.patchValue({ firstName: 'Ana', lastName: 'Gil' });
      await component.onSubmit();
      expect(component.saved.emit).not.toHaveBeenCalled();
    });

    it('emits cancelled on cancel', () => {
      spyOn(component.cancelled, 'emit');
      component.onCancel();
      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => render(stored));

    it('fills the stored player and waits for a change before enabling update', () => {
      expect(component.form.getRawValue()).toEqual(jasmine.objectContaining({ club: 'Norte', documentId: '301', isActive: true }));
      expect(component.canSubmit).toBeFalse();
      component.form.get('club')!.setValue('Sur');
      component.form.markAsDirty();
      expect(component.canSubmit).toBeTrue();
    });

    it('shows the status toggle and sends the chosen status with the player id', async () => {
      expect((fixture.nativeElement as HTMLElement).querySelector('app-active-toggle')).not.toBeNull();
      component.form.get('isActive')!.setValue(false);
      component.form.markAsDirty();
      await component.onSubmit();
      expect(facadeSpy.save).toHaveBeenCalledOnceWith(jasmine.objectContaining({ isActive: false }), 'p1');
    });
  });
});
