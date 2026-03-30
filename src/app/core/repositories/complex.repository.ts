import { Complex, Court, Availability, ComplexServiceAssignment, ComplexSocialNetwork } from '../models';

export interface ComplexRepository {
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
  // Assignments
  getServiceAssignments(complexId: string): Promise<ComplexServiceAssignment[]>;
  saveServiceAssignments(complexId: string, assignments: ComplexServiceAssignment[]): Promise<ComplexServiceAssignment[]>;
  getSocialNetworks(complexId: string): Promise<ComplexSocialNetwork[]>;
  saveSocialNetworks(complexId: string, networks: ComplexSocialNetwork[]): Promise<ComplexSocialNetwork[]>;
}
