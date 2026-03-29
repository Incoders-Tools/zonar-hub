export interface Complex {
  id: string;
  name: string;
  address: string;
  cityId: string;
  cityName: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  courtsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Court {
  id: string;
  complexId: string;
  name: string;
  surfaceType: string;
  isIndoor: boolean;
  isActive: boolean;
}
