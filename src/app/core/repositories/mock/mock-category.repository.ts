import { Injectable } from '@angular/core';
import { Category } from '../../models';
import { CategoryRepository } from '../category.repository';
import { MOCK_CATEGORIES } from '../../data/mock/mock-catalogs';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const MOCK_DELAY = 400;
const STORAGE_COLLECTION = 'categories';

interface CatalogStorageState<T> { data: T[]; counter: number; }

@Injectable({ providedIn: 'root' })
export class MockCategoryRepository implements CategoryRepository {
  private categories: Category[];
  private idCounter: number;

  constructor() {
    const stored = loadFromStorage<CatalogStorageState<Category>>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.categories = stored.data;
      this.idCounter = stored.counter;
    } else {
      this.categories = structuredClone(MOCK_CATEGORIES);
      this.idCounter = this.categories.length;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.categories, counter: this.idCounter });
  }

  private delay<T>(value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), MOCK_DELAY));
  }

  async getAll(): Promise<Category[]> {
    return this.delay(structuredClone(this.categories));
  }

  async getById(id: string): Promise<Category | undefined> {
    const found = this.categories.find(c => c.id === id);
    return this.delay(found ? structuredClone(found) : undefined);
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const now = new Date().toISOString();
    const newCategory: Category = {
      ...category,
      id: `cat${++this.idCounter}`,
      createdAt: now,
      updatedAt: now
    };
    this.categories.push(newCategory);
    this.persist();
    return this.delay(structuredClone(newCategory));
  }

  async update(id: string, changes: Partial<Category>): Promise<Category> {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Category ${id} not found`);
    }
    this.categories[idx] = { ...this.categories[idx], ...changes, updatedAt: new Date().toISOString() };
    this.persist();
    return this.delay(structuredClone(this.categories[idx]));
  }

  async delete(id: string): Promise<void> {
    this.categories = this.categories.filter(c => c.id !== id);
    this.persist();
    return this.delay(undefined);
  }

  async getExistingKeys(): Promise<string[]> {
    return this.delay(this.categories.map(c => c.key));
  }
}
