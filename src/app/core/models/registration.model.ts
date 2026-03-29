export type RegistrationSource = 'wizard' | 'admin' | 'excel';

export type RegistrationStatusId = 'rs1' | 'rs2' | 'rs3';

export interface Registration {
  id: string;
  tournamentId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  categoryId: string;
  categoryName: string;
  genderId: string;
  genderLabel: string;
  statusId: RegistrationStatusId;
  statusLabel: string;
  source: RegistrationSource;
  registeredAt: string;
  confirmedAt?: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  paymentStatus?: string;
}

export interface RegistrationAvailability {
  id: string;
  registrationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RegistrationToken {
  id: string;
  tournamentId: string;
  code: string;
  isActive: boolean;
  createdBy: string;
  assignedTo: string | null;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface RegistrationMeta {
  id: string;
  registrationId: string;
  key: string;
  value: string;
}
