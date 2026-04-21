import { Injectable } from '@angular/core';
import { SocialNetwork } from '../../models';
import { SocialNetworkRepository } from '../social-network.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'social_networks';

interface SnStorageState { data: SocialNetwork[]; counter: number; }

const MOCK_SOCIAL_NETWORKS: SocialNetwork[] = [
  {
    id: 'sn1',
    name: 'Instagram',
    key: 'instagram',
    url: 'https://instagram.com/',
    description: 'Social media platform',
    faIcon: 'FaInstagram',
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sn2',
    name: 'Facebook',
    key: 'facebook',
    url: 'https://facebook.com/',
    description: 'Social network',
    faIcon: 'FaFacebook',
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sn3',
    name: 'Twitter',
    key: 'twitter',
    url: 'https://twitter.com/',
    description: 'Microblogging platform',
    faIcon: 'FaTwitter',
    sortOrder: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

@Injectable({ providedIn: 'root' })
export class MockSocialNetworkRepository implements SocialNetworkRepository {
  private networks: SocialNetwork[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<SnStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.networks = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.networks = structuredClone(MOCK_SOCIAL_NETWORKS);
      this.idCounter = this.networks.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.networks, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<SocialNetwork[]> {
    return this.delay(structuredClone(this.networks));
  }

  async getById(id: string): Promise<SocialNetwork | undefined> {
    const found = this.networks.find(n => n.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(network: Omit<SocialNetwork, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialNetwork> {
    const now = new Date().toISOString();
    const newNetwork: SocialNetwork = {
      ...network,
      id: `sn${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.networks.push(newNetwork);
    this.persist();
    return this.delay(structuredClone(newNetwork));
  }

  async update(id: string, changes: Partial<SocialNetwork>): Promise<SocialNetwork> {
    const idx = this.networks.findIndex(n => n.id === id);
    if (idx === -1) {
      throw new Error(`SocialNetwork ${id} not found`);
    }
    this.networks[idx] = { ...this.networks[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.networks[idx]));
  }

  async delete(id: string): Promise<void> {
    this.networks = this.networks.filter(n => n.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.networks.map(n => n.key));
  }
}
