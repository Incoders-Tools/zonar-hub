import { Gender } from '../models';

export interface GenderRepository {
  getAll(): Promise<Gender[]>;
  getById(id: string): Promise<Gender | undefined>;
  create(gender: Omit<Gender, 'id'>): Promise<Gender>;
  update(id: string, gender: Partial<Gender>): Promise<Gender>;
  delete(id: string): Promise<void>;
  getExistingKeys(): Promise<string[]>;
}
