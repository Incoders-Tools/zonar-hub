import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TournamentEligibilityProfilesFormPanelComponent } from './tournament-eligibility-profiles-form-panel.component';
import { TournamentEligibilityProfilesFacadeService } from '../tournament-eligibility-profiles-facade.service';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { Gender, TournamentEligibilityProfile } from '../../../../../core/models';

const stored: TournamentEligibilityProfile = {
  id: 'ep-1', name: 'Damas', key: '', description: null, sortOrder: null, isActive: true, createdAt: '', updatedAt: '',
  slots: [{ slotNumber: 1, genderId: 'g-f', categoryId: null, minAge: 18, maxAge: null, label: 'Jugadora', required: true }]
};

const genders: Gender[] = [{ id: 'g-f', name: 'Femenino', key: 'female', isActive: true, sortOrder: 1, createdAt: '', updatedAt: '' }];

describe('TournamentEligibilityProfilesFormPanelComponent', () => {
  let component: TournamentEligibilityProfilesFormPanelComponent;
  let fixture: ComponentFixture<TournamentEligibilityProfilesFormPanelComponent>;
  let facade: jasmine.SpyObj<TournamentEligibilityProfilesFacadeService>;

  async function render(profile: TournamentEligibilityProfile | null): Promise<void> {
    facade = jasmine.createSpyObj<TournamentEligibilityProfilesFacadeService>('Facade', ['saveProfile', 'isNameTaken']);
    facade.saveProfile.and.resolveTo(true);
    facade.isNameTaken.and.returnValue(false);
    await TestBed.configureTestingModule({
      imports: [TournamentEligibilityProfilesFormPanelComponent],
      providers: [I18nService, provideNoopAnimations(), { provide: TournamentEligibilityProfilesFacadeService, useValue: facade }]
    }).compileComponents();
    fixture = TestBed.createComponent(TournamentEligibilityProfilesFormPanelComponent);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('genders', genders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => render(null));

    it('starts with two required participants and waits for a name', () => {
      expect(component.slotsArray.length).toBe(2);
      expect(component.slotsArray.getRawValue().map(s => [s.slotNumber, s.required])).toEqual([[1, true], [2, true]]);
      expect(component.canSubmit).toBeFalse();
      component.form.get('name')!.setValue('Damas');
      expect(component.canSubmit).toBeTrue();
    });

    it('offers the active genders as slot options', () => {
      const genderColumn = component.slotColumns().find(c => c.key === 'genderId')!;
      expect(genderColumn.options).toEqual([{ value: 'g-f', label: 'Femenino' }]);
    });

    it('adds the next free slot number', () => {
      component.slotsArray.push(component.slotRowFactory());
      expect(component.slotsArray.at(2).get('slotNumber')!.value).toBe(3);
    });

    it('blocks a profile without participants', () => {
      component.form.get('name')!.setValue('Damas');
      component.slotsArray.clear();
      expect(component.canSubmit).toBeFalse();
      expect(component.slotErrorKeys).toContain('eligibility_profiles.errors.slots_required');
    });

    it('blocks repeated slot numbers, numbers outside 1..16 and inverted age ranges', () => {
      component.form.get('name')!.setValue('Damas');
      component.slotsArray.at(1).get('slotNumber')!.setValue(1);
      expect(component.canSubmit).toBeFalse();
      expect(component.slotErrorKeys).toContain('admin.tournament-eligibility-profiles.validation.duplicateSlot');

      component.slotsArray.at(1).get('slotNumber')!.setValue(17);
      expect(component.slotErrorKeys).toContain('eligibility_profiles.errors.invalid_slot');

      component.slotsArray.at(1).patchValue({ slotNumber: 2, minAge: 40, maxAge: 18 });
      expect(component.canSubmit).toBeFalse();
      expect(component.slotErrorKeys).toEqual(['eligibility_profiles.errors.invalid_age_range']);
    });

    it('blocks a name another profile already uses', () => {
      facade.isNameTaken.and.returnValue(true);
      component.form.get('name')!.setValue('Damas');
      expect(component.canSubmit).toBeFalse();
    });

    it('sends the API body with empty rules as null and emits saved', async () => {
      spyOn(component.saved, 'emit');
      component.form.patchValue({ name: 'Damas', description: '' });
      component.slotsArray.at(0).patchValue({ genderId: 'g-f', minAge: '18', label: 'Jugadora' });
      component.slotsArray.at(1).patchValue({ required: false });
      await component.onSave();
      expect(facade.saveProfile).toHaveBeenCalledOnceWith({
        name: 'Damas', description: '', isActive: true,
        slots: [
          { slotNumber: 1, genderId: 'g-f', categoryId: null, minAge: 18, maxAge: null, label: 'Jugadora', required: true },
          { slotNumber: 2, genderId: null, categoryId: null, minAge: null, maxAge: null, label: null, required: false }
        ]
      }, undefined);
      expect(component.saved.emit).toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => render(stored));

    it('fills the stored slots and waits for a change before enabling update', () => {
      expect(component.slotsArray.length).toBe(1);
      expect(component.slotsArray.at(0).get('minAge')!.value).toBe(18);
      expect(component.canSubmit).toBeFalse();
      component.form.get('isActive')!.setValue(false);
      component.form.markAsDirty();
      expect(component.canSubmit).toBeTrue();
    });

    it('shows the status toggle and saves with the profile id', async () => {
      expect((fixture.nativeElement as HTMLElement).querySelector('app-active-toggle')).not.toBeNull();
      component.form.get('isActive')!.setValue(false);
      component.form.markAsDirty();
      await component.onSave();
      expect(facade.saveProfile).toHaveBeenCalledOnceWith(jasmine.objectContaining({ isActive: false }), 'ep-1');
    });
  });
});
