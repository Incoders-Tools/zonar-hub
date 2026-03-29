export interface Category {
  id: string;
  name: string;
  shortName: string;
  key: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Gender {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  provinceOrState?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface TournamentStatus {
  id: string;
  label: string;
  color: string;
}

export interface TournamentType {
  id: string;
  name: string;
  description?: string;
}

export interface PlayerCondition {
  id: string;
  label: string;
}

export interface SocialNetwork {
  id: string;
  name: string;
  icon: string;
}

export interface ComplexService {
  id: string;
  name: string;
  icon: string;
}
