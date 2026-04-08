import { TournamentEligibilityProfile } from '../../models';

export const MOCK_ELIGIBILITY_PROFILES: TournamentEligibilityProfile[] = [
  {
    id: 'ep1',
    name: 'Padel Dobles Masculino',
    key: 'padel-doubles-male',
    description: 'Perfil para torneos de padel dobles masculinos',
    sortOrder: 1,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    slots: [
      {
        id: 'eps1',
        profileId: 'ep1',
        slotNumber: 1,
        genderId: 'g1',
        genderName: 'Caballeros',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.player1',
        required: true
      },
      {
        id: 'eps2',
        profileId: 'ep1',
        slotNumber: 2,
        genderId: 'g1',
        genderName: 'Caballeros',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.player2',
        required: true
      }
    ]
  },
  {
    id: 'ep2',
    name: 'Padel Dobles Femenino',
    key: 'padel-doubles-female',
    description: 'Perfil para torneos de padel dobles femeninos',
    sortOrder: 2,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    slots: [
      {
        id: 'eps3',
        profileId: 'ep2',
        slotNumber: 1,
        genderId: 'g2',
        genderName: 'Damas',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.player1',
        required: true
      },
      {
        id: 'eps4',
        profileId: 'ep2',
        slotNumber: 2,
        genderId: 'g2',
        genderName: 'Damas',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.player2',
        required: true
      }
    ]
  },
  {
    id: 'ep3',
    name: 'Padel Mixto',
    key: 'padel-mixed',
    description: 'Perfil para torneos de padel mixto (1 masculino + 1 femenino)',
    sortOrder: 3,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    slots: [
      {
        id: 'eps5',
        profileId: 'ep3',
        slotNumber: 1,
        genderId: 'g1',
        genderName: 'Caballeros',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.playerMale',
        required: true
      },
      {
        id: 'eps6',
        profileId: 'ep3',
        slotNumber: 2,
        genderId: 'g2',
        genderName: 'Damas',
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.playerFemale',
        required: true
      }
    ]
  },
  {
    id: 'ep4',
    name: 'Tenis Singles',
    key: 'tenis-singles',
    description: 'Perfil para torneos de tenis singles',
    sortOrder: 4,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    slots: [
      {
        id: 'eps7',
        profileId: 'ep4',
        slotNumber: 1,
        genderId: null,
        categoryId: null,
        minAge: null,
        maxAge: null,
        label: 'participantSearch.slot.player',
        required: true
      }
    ]
  }
];
