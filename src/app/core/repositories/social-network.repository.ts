import { SocialNetwork } from '../models';

export interface SocialNetworkRepository {
  getAll(): Promise<SocialNetwork[]>;
  getById(id: string): Promise<SocialNetwork | undefined>;
  create(network: Omit<SocialNetwork, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialNetwork>;
  update(id: string, network: Partial<SocialNetwork>): Promise<SocialNetwork>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
