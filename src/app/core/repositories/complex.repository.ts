import { Complex, Court, Availability } from '../models';

export interface SaveComplexWithCourtsRequest {
  complexId: string | null;
  organizationId: string;
  name: string;
  address: string;
  key?: string | null;
  location?: string | null;
  description?: string | null;
  sortOrder?: number;
  preponderance?: number;
  logoImagePath?: string | null;
  coverImagePath?: string | null;
  layoutDiagramPath?: string | null;
  isActive?: boolean;
  courts: {
    id: string | null;
    name: string;
    isActive: boolean;
    surfaceType: string | null;
    isIndoor: boolean;
    sportIds: string[] | null;
  }[];
  deleteCourtIds: string[];
}

export interface SaveComplexWithCourtsResult {
  complexId: string;
  courtCount: number;
  courtIds: string[];
}

export interface ComplexRepository {
  saveWithCourts(request: SaveComplexWithCourtsRequest): Promise<SaveComplexWithCourtsResult>;
  getAll(): Promise<Complex[]>;
  getById(id: string): Promise<Complex | undefined>;
  create(complex: Omit<Complex, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complex>;
  update(id: string, complex: Partial<Complex>): Promise<Complex>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
  // Courts
  getCourtsByComplexId(complexId: string): Promise<Court[]>;
  createCourt(court: Omit<Court, 'id'>): Promise<Court>;
  updateCourt(id: string, court: Partial<Court>): Promise<Court>;
  deleteCourt(id: string): Promise<void>;
  // Availability
  getAvailabilityByCourtId(courtId: string): Promise<Availability[]>;
  saveAvailability(courtId: string, slots: Omit<Availability, 'id' | 'courtId'>[]): Promise<Availability[]>;
}
