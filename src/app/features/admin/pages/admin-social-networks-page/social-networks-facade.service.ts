import { Injectable, inject, signal, computed } from '@angular/core';
import { SocialNetwork } from '../../../../core/models';
import { MockSocialNetworkRepository } from '../../../../core/repositories/mock/mock-social-network.repository';

export interface SocialNetworkFilters {
  name?: string;
  isActive?: string;
}

@Injectable()
export class SocialNetworksFacadeService {
  private readonly repository = inject(MockSocialNetworkRepository);

  private readonly entitiesState = signal<SocialNetwork[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<SocialNetworkFilters>({});
  private readonly sortState = signal<string>('sort_order_asc');

  readonly entities = this.entitiesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly deleting = this.deletingState;
  readonly error = this.errorState;

  readonly filteredNetworks = computed(() => {
    const networks = this.entitiesState();
    const filters = this.filtersState();

    let result = [...networks];

    if (filters.name?.trim()) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter(n => n.name.toLowerCase().includes(searchTerm));
    }

    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(n => n.isActive === isActive);
    }

    const sortOption = this.sortState();
    if (sortOption === 'sort_order_asc') {
      result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    } else if (sortOption === 'sort_order_desc') {
      result.sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
    } else if (sortOption === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const networks = await this.repository.getAll();
      this.entitiesState.set(networks);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: SocialNetworkFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  applySortOption(sortOption: string): void {
    this.sortState.set(sortOption);
  }

  async saveNetwork(network: SocialNetwork | Omit<SocialNetwork, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const isUpdate = 'id' in network && network.id;

      if (isUpdate) {
        const updated = await this.repository.update((network as SocialNetwork).id, network);
        const idx = this.entitiesState().findIndex(n => n.id === (network as SocialNetwork).id);
        if (idx !== -1) {
          const updated_networks = [...this.entitiesState()];
          updated_networks[idx] = updated;
          this.entitiesState.set(updated_networks);
        }
      } else {
        const created = await this.repository.create(network as Omit<SocialNetwork, 'id' | 'createdAt' | 'updatedAt'>);
        this.entitiesState.set([...this.entitiesState(), created]);
      }

      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteNetwork(id: string): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await this.repository.delete(id);
      this.entitiesState.set(this.entitiesState().filter(n => n.id !== id));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    try {
      this.deletingState.set(true);
      this.errorState.set(null);
      await Promise.all(ids.map(id => this.repository.delete(id)));
      this.entitiesState.set(this.entitiesState().filter(n => !ids.includes(n.id)));
      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.deletingState.set(false);
    }
  }

  async checkKeyExists(key: string, currentId?: string): Promise<boolean> {
    try {
      const existingKeys = await this.repository.getExistingKeys();
      if (currentId) {
        const currentEntity = this.entitiesState().find(n => n.id === currentId);
        return existingKeys.includes(key) && currentEntity?.key !== key;
      }
      return existingKeys.includes(key);
    } catch {
      return false;
    }
  }

  async checkNameExists(name: string, currentId?: string): Promise<boolean> {
    try {
      if (currentId) {
        return this.entitiesState().some(
          n => n.name.toLowerCase() === name.toLowerCase() && n.id !== currentId
        );
      }
      return this.entitiesState().some(n => n.name.toLowerCase() === name.toLowerCase());
    } catch {
      return false;
    }
  }

  async checkSortOrderExists(sortOrder: number | null, currentId?: string): Promise<boolean> {
    try {
      if (!sortOrder || sortOrder === 0) {
        return false;
      }
      if (currentId) {
        return this.entitiesState().some(
          n => n.sortOrder === sortOrder && n.id !== currentId
        );
      }
      return this.entitiesState().some(n => n.sortOrder === sortOrder);
    } catch {
      return false;
    }
  }

  getNextSortOrder(): number {
    const max = Math.max(0, ...this.entitiesState().map(n => n.sortOrder ?? 0));
    return max + 1;
  }
}
