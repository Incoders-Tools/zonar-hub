export interface Complex {
  id: string;
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
  sportId?: string;
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

export interface ComplexServiceAssignment {
  serviceId: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ComplexSocialNetwork {
  socialNetworkId: string;
  profileUrl: string;
  isActive: boolean;
}
