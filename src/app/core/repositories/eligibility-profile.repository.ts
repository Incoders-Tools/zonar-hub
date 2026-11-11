import { TournamentEligibilityProfile, TournamentEligibilitySlot } from '../models/tournament-admin.model';

/** Rules of one participant slot as the API stores them; null rules do not restrict (D3). */
export type EligibilitySlotWrite = Pick<
  TournamentEligibilitySlot,
  'slotNumber' | 'genderId' | 'categoryId' | 'minAge' | 'maxAge' | 'label' | 'required'
>;

/** Editable fields of an organization eligibility profile; `isActive` is only read on update. */
export interface EligibilityProfileWrite {
  name: string;
  description: string | null;
  isActive: boolean;
  slots: EligibilitySlotWrite[];
}

export interface EligibilityProfileRepository {
  getAll(): Promise<TournamentEligibilityProfile[]>;
  getById(id: string): Promise<TournamentEligibilityProfile | undefined>;
  create(profile: EligibilityProfileWrite): Promise<TournamentEligibilityProfile>;
  update(id: string, profile: EligibilityProfileWrite): Promise<TournamentEligibilityProfile>;
  /** Rejects with `eligibility_profiles.errors.in_use` while a tournament references the profile. */
  delete(id: string): Promise<void>;
}
