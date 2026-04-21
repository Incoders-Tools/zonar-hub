import { Injectable } from '@angular/core';
import { ComplexService } from '../../models';
import { ComplexServiceRepository } from '../complex-service.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'complex_services';

interface CsStorageState { data: ComplexService[]; counter: number; }

const MOCK_COMPLEX_SERVICES: ComplexService[] = [
  {
    id: 'cs1',
    name: 'WiFi',
    key: 'wifi',
    faIcon: 'FaWifi',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cs2',
    name: 'Parking',
    key: 'parking',
    faIcon: 'FaParking',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cs3',
    name: 'Cafeteria',
    key: 'cafeteria',
    faIcon: 'FaUtensils',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

@Injectable({ providedIn: 'root' })
export class MockComplexServiceRepository implements ComplexServiceRepository {
  private services: ComplexService[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<CsStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.services = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.services = structuredClone(MOCK_COMPLEX_SERVICES);
      this.idCounter = this.services.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.services, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<ComplexService[]> {
    return this.delay(structuredClone(this.services));
  }

  async getById(id: string): Promise<ComplexService | undefined> {
    const found = this.services.find(s => s.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(service: Omit<ComplexService, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplexService> {
    const now = new Date().toISOString();
    const newService: ComplexService = {
      ...service,
      id: `cs${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.services.push(newService);
    this.persist();
    return this.delay(structuredClone(newService));
  }

  async update(id: string, changes: Partial<ComplexService>): Promise<ComplexService> {
    const idx = this.services.findIndex(s => s.id === id);
    if (idx === -1) {
      throw new Error(`ComplexService ${id} not found`);
    }
    this.services[idx] = { ...this.services[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.services[idx]));
  }

  async delete(id: string): Promise<void> {
    this.services = this.services.filter(s => s.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.services.map(s => s.key));
  }
}
