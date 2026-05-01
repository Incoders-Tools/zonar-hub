export interface Complex {
  id: string;
  organizationId?: string;
  organizationName?: string;
  name: string;
  key: string;
  address: string;
  location?: string;
  cityId: string;
  cityName: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  logoImagePath?: string;
  coverImagePath?: string;
  layoutDiagramPath?: string;
  description?: string;
  sortOrder: number;
  preponderance: number;
  sportsSupported: string[];
  courtsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Court {
  id: string;
  complexId: string;
  name: string;
  sportIds: string[];
  surfaceType: string;
  isIndoor: boolean;
  isActive: boolean;
}

export interface Availability {
  id: string;
  courtId: string;
  dayOfWeek: number;
  timeFrom: string;
  timeTo: string;
  isAvailable: boolean;
  overrideType?: 'blocked' | 'partial' | null;
}
