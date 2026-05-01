import { Injectable } from '@angular/core';
import { Complex, Court, Availability, ComplexServiceAssignment, ComplexSocialNetwork } from '../../models';
import { ComplexRepository } from '../complex.repository';
import { getCurrentMockTenantId, isDemoTenant } from '../../data/mock/mock-persistence';
import { tenantStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;

const STORAGE_COLLECTION = 'complexes';

interface ComplexStorageState {
  complexes: Complex[];
  courts: Court[];
  availability: Availability[];
  serviceAssignments: Record<string, ComplexServiceAssignment[]>;
  socialNetworks: Record<string, ComplexSocialNetwork[]>;
  complexIdCounter: number;
  courtIdCounter: number;
  availabilityIdCounter: number;
}

const MOCK_COMPLEXES: Complex[] = [
  {
    id: 'cx1',
    name: 'Club Pádel Norte',
    key: 'club_padel_norte',
    address: 'Av. Libertador 1234',
    location: 'Palermo',
    cityId: 'city1',
    cityName: 'Buenos Aires',
    phone: '+54 11 5555-0001',
    email: 'info@padelnorte.com',
    imageUrl: '',
    logoImagePath: '',
    coverImagePath: '',
    layoutDiagramPath: '',
    description: 'Club premium de pádel',
    sortOrder: 1,
    preponderance: 10,
    sportsSupported: ['sp1'],
    courtsCount: 4,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-01T14:30:00Z'
  },
  {
    id: 'cx2',
    name: 'Arena Sur',
    key: 'arena_sur',
    address: 'Bv. San Juan 567',
    location: 'Centro',
    cityId: 'city2',
    cityName: 'Córdoba',
    phone: '+54 351 555-0002',
    email: 'contacto@arenasur.com',
    imageUrl: '',
    logoImagePath: '',
    coverImagePath: '',
    layoutDiagramPath: '',
    description: 'Complejo multideportivo',
    sortOrder: 2,
    preponderance: 8,
    sportsSupported: ['sp1', 'sp2'],
    courtsCount: 3,
    isActive: true,
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-05-20T11:00:00Z'
  },
  {
    id: 'cx3',
    name: 'Centro Deportivo Este',
    key: 'centro_deportivo_este',
    address: 'Pellegrini 890',
    location: 'Zona Norte',
    cityId: 'city3',
    cityName: 'Rosario',
    phone: '+54 341 555-0003',
    email: 'reservas@centroeste.com',
    imageUrl: '',
    logoImagePath: '',
    coverImagePath: '',
    layoutDiagramPath: '',
    description: 'Canchas de primer nivel',
    sortOrder: 3,
    preponderance: 6,
    sportsSupported: ['sp1', 'sp4'],
    courtsCount: 2,
    isActive: false,
    createdAt: '2024-03-05T08:00:00Z',
    updatedAt: '2024-04-15T16:00:00Z'
  }
];

const MOCK_COURTS: Court[] = [
  // Club Pádel Norte courts
  { id: 'ct1', complexId: 'cx1', name: 'Cancha 1', sportIds: ['sp1'], surfaceType: 'synthetic', isIndoor: false, isActive: true },
  { id: 'ct2', complexId: 'cx1', name: 'Cancha 2', sportIds: ['sp1'], surfaceType: 'synthetic', isIndoor: false, isActive: true },
  { id: 'ct3', complexId: 'cx1', name: 'Cancha 3', sportIds: ['sp1'], surfaceType: 'cement', isIndoor: true, isActive: true },
  { id: 'ct4', complexId: 'cx1', name: 'Cancha 4', sportIds: ['sp1'], surfaceType: 'grass', isIndoor: false, isActive: false },
  // Arena Sur courts
  { id: 'ct5', complexId: 'cx2', name: 'Cancha A', sportIds: ['sp1'], surfaceType: 'synthetic', isIndoor: true, isActive: true },
  { id: 'ct6', complexId: 'cx2', name: 'Cancha B', sportIds: ['sp2'], surfaceType: 'cement', isIndoor: false, isActive: true },
  { id: 'ct7', complexId: 'cx2', name: 'Cancha C', sportIds: ['sp1', 'sp2'], surfaceType: 'grass', isIndoor: false, isActive: true },
  // Centro Deportivo Este courts
  { id: 'ct8', complexId: 'cx3', name: 'Pista 1', sportIds: ['sp1'], surfaceType: 'clay', isIndoor: false, isActive: true },
  { id: 'ct9', complexId: 'cx3', name: 'Pista 2', sportIds: ['sp4'], surfaceType: 'synthetic', isIndoor: true, isActive: true }
];

// Default weekday availability for first complex's first court (8:00-22:00 Mon-Fri)
function generateDefaultAvailability(): Availability[] {
  const slots: Availability[] = [];
  let idCounter = 0;
  for (let day = 1; day <= 5; day++) {
    for (let hour = 8; hour < 22; hour++) {
      const timeFrom = `${hour.toString().padStart(2, '0')}:00`;
      const timeTo = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push({
        id: `av${++idCounter}`,
        courtId: 'ct1',
        dayOfWeek: day,
        timeFrom,
        timeTo,
        isAvailable: true,
        overrideType: null
      });
    }
  }
  return slots;
}

const MOCK_AVAILABILITY: Availability[] = generateDefaultAvailability();

const MOCK_SERVICE_ASSIGNMENTS: Record<string, ComplexServiceAssignment[]> = {
  cx1: [
    { serviceId: 'cs1', isActive: true, sortOrder: 1 },
    { serviceId: 'cs2', isActive: true, sortOrder: 2 },
    { serviceId: 'cs3', isActive: true, sortOrder: 3 }
  ],
  cx2: [
    { serviceId: 'cs1', isActive: true, sortOrder: 1 },
    { serviceId: 'cs3', isActive: false, sortOrder: 2 }
  ],
  cx3: []
};

const MOCK_SOCIAL_NETWORKS: Record<string, ComplexSocialNetwork[]> = {
  cx1: [
    { socialNetworkId: 'sn1', profileUrl: 'https://instagram.com/padelnorte', isActive: true },
    { socialNetworkId: 'sn2', profileUrl: 'https://facebook.com/padelnorte', isActive: true }
  ],
  cx2: [
    { socialNetworkId: 'sn1', profileUrl: 'https://instagram.com/arenasur', isActive: true }
  ],
  cx3: []
};

@Injectable({ providedIn: 'root' })
export class MockComplexRepository implements ComplexRepository {
  private complexes: Complex[] = [];
  private courts: Court[] = [];
  private availability: Availability[] = [];
  private serviceAssignments: Record<string, ComplexServiceAssignment[]> = {};
  private socialNetworks: Record<string, ComplexSocialNetwork[]> = {};
  private complexIdCounter = 0;
  private courtIdCounter = 0;
  private availabilityIdCounter = 0;
  private _seededForTenant: string | null = '__none__';

  private ensureSeed(): void {
    const tid = getCurrentMockTenantId();
    if (this._seededForTenant === tid) return;
    this._seededForTenant = tid;
    const stored = loadFromStorage<ComplexStorageState>(tenantStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.complexes = stored.complexes;
      this.courts = stored.courts;
      this.availability = stored.availability;
      this.serviceAssignments = stored.serviceAssignments;
      this.socialNetworks = stored.socialNetworks;
      this.complexIdCounter = stored.complexIdCounter;
      this.courtIdCounter = stored.courtIdCounter;
      this.availabilityIdCounter = stored.availabilityIdCounter;
    } else if (isDemoTenant()) {
      this.complexes = structuredClone(MOCK_COMPLEXES);
      this.courts = structuredClone(MOCK_COURTS);
      this.availability = structuredClone(MOCK_AVAILABILITY);
      this.serviceAssignments = structuredClone(MOCK_SERVICE_ASSIGNMENTS);
      this.socialNetworks = structuredClone(MOCK_SOCIAL_NETWORKS);
      this.complexIdCounter = this.complexes.length;
      this.courtIdCounter = this.courts.length;
      this.availabilityIdCounter = this.availability.length;
    } else {
      this.complexes = [];
      this.courts = [];
      this.availability = [];
      this.serviceAssignments = {};
      this.socialNetworks = {};
      this.complexIdCounter = 0;
      this.courtIdCounter = 0;
      this.availabilityIdCounter = 0;
    }
  }

  private persist(): void {
    const state: ComplexStorageState = {
      complexes: this.complexes,
      courts: this.courts,
      availability: this.availability,
      serviceAssignments: this.serviceAssignments,
      socialNetworks: this.socialNetworks,
      complexIdCounter: this.complexIdCounter,
      courtIdCounter: this.courtIdCounter,
      availabilityIdCounter: this.availabilityIdCounter
    };
    persistToStorage(tenantStorageKey(STORAGE_COLLECTION), state);
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  // --- Complex CRUD ---

  async getAll(): Promise<Complex[]> {
    this.ensureSeed();
    return this.delay(structuredClone(this.complexes));
  }

  async getById(id: string): Promise<Complex | undefined> {
    const found = this.complexes.find(c => c.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(complex: Omit<Complex, 'id' | 'createdAt' | 'updatedAt'>): Promise<Complex> {
    const now = new Date().toISOString();
    const newComplex: Complex = {
      ...complex,
      id: `cx${++this.complexIdCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.complexes.push(newComplex);
    this.persist();
    return this.delay(structuredClone(newComplex));
  }

  async update(id: string, changes: Partial<Complex>): Promise<Complex> {
    const idx = this.complexes.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Complex ${id} not found`);
    }
    this.complexes[idx] = { ...this.complexes[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.complexes[idx]));
  }

  async delete(id: string): Promise<void> {
    this.complexes = this.complexes.filter(c => c.id !== id);
    // Also delete related courts and their availability
    const courtIds = this.courts.filter(ct => ct.complexId === id).map(ct => ct.id);
    this.courts = this.courts.filter(ct => ct.complexId !== id);
    this.availability = this.availability.filter(av => !courtIds.includes(av.courtId));
    delete this.serviceAssignments[id];
    delete this.socialNetworks[id];
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.complexes.map(c => c.key));
  }

  // --- Courts ---

  async getCourtsByComplexId(complexId: string): Promise<Court[]> {
    const filtered = this.courts.filter(ct => ct.complexId === complexId);
    return this.delay(structuredClone(filtered));
  }

  async createCourt(court: Omit<Court, 'id'>): Promise<Court> {
    const newCourt: Court = {
      ...court,
      id: `ct${++this.courtIdCounter}`
    };
    this.courts.push(newCourt);
    // Update courtsCount
    const complex = this.complexes.find(c => c.id === court.complexId);
    if (complex) {
      complex.courtsCount = this.courts.filter(ct => ct.complexId === court.complexId).length;
    }
    this.persist();
    return this.delay(structuredClone(newCourt));
  }

  async updateCourt(id: string, changes: Partial<Court>): Promise<Court> {
    const idx = this.courts.findIndex(ct => ct.id === id);
    if (idx === -1) {
      throw new Error(`Court ${id} not found`);
    }
    this.courts[idx] = { ...this.courts[idx], ...changes };
    this.persist();
    return this.delay(structuredClone(this.courts[idx]));
  }

  async deleteCourt(id: string): Promise<void> {
    const court = this.courts.find(ct => ct.id === id);
    this.courts = this.courts.filter(ct => ct.id !== id);
    this.availability = this.availability.filter(av => av.courtId !== id);
    // Update courtsCount
    if (court) {
      const complex = this.complexes.find(c => c.id === court.complexId);
      if (complex) {
        complex.courtsCount = this.courts.filter(ct => ct.complexId === court.complexId).length;
      }
    }
    this.persist();
    return this.delay(undefined);
  }

  // --- Availability ---

  async getAvailabilityByCourtId(courtId: string): Promise<Availability[]> {
    const filtered = this.availability.filter(av => av.courtId === courtId);
    return this.delay(structuredClone(filtered));
  }

  async saveAvailability(courtId: string, slots: Omit<Availability, 'id' | 'courtId'>[]): Promise<Availability[]> {
    // Remove existing availability for this court
    this.availability = this.availability.filter(av => av.courtId !== courtId);
    // Add new slots
    const newSlots: Availability[] = slots.map(slot => ({
      ...slot,
      id: `av${++this.availabilityIdCounter}`,
      courtId
    }));
    this.availability.push(...newSlots);
    this.persist();
    return this.delay(structuredClone(newSlots));
  }

  // --- Service Assignments ---

  async getServiceAssignments(complexId: string): Promise<ComplexServiceAssignment[]> {
    const assignments = this.serviceAssignments[complexId] || [];
    return this.delay(structuredClone(assignments));
  }

  async saveServiceAssignments(complexId: string, assignments: ComplexServiceAssignment[]): Promise<ComplexServiceAssignment[]> {
    this.serviceAssignments[complexId] = structuredClone(assignments);
    this.persist();
    return this.delay(structuredClone(assignments));
  }

  // --- Social Networks ---

  async getSocialNetworks(complexId: string): Promise<ComplexSocialNetwork[]> {
    const networks = this.socialNetworks[complexId] || [];
    return this.delay(structuredClone(networks));
  }

  async saveSocialNetworks(complexId: string, networks: ComplexSocialNetwork[]): Promise<ComplexSocialNetwork[]> {
    this.socialNetworks[complexId] = structuredClone(networks);
    this.persist();
    return this.delay(structuredClone(networks));
  }
}
