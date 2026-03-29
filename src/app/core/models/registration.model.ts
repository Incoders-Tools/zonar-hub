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
  statusId: string;
  statusLabel: string;
  registeredAt: string;
  confirmedAt?: string;
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
  registrationId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
}

export interface RegistrationMeta {
  id: string;
  registrationId: string;
  key: string;
  value: string;
}
