import { Injectable, computed, inject, signal } from '@angular/core';
import { EmailTemplate } from '../../../../core/models';
import { ApiEmailTemplateRepository } from '../../../../core/repositories/api/api-email-template.repository';

export interface EmailTemplateFilters {
  key?: string;
  isActive?: string;
}

@Injectable()
export class EmailTemplatesFacadeService {
  private readonly repository = inject(ApiEmailTemplateRepository);

  private readonly templatesState = signal<EmailTemplate[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly filtersState = signal<EmailTemplateFilters>({});

  readonly templates = this.templatesState;
  readonly loading = this.loadingState;
  readonly saving = this.savingState;
  readonly error = this.errorState;

  readonly filteredTemplates = computed(() => {
    const templates = this.templatesState();
    const filters = this.filtersState();

    let result = [...templates];

    if (filters.key?.trim()) {
      const search = filters.key.trim().toLowerCase();
      result = result.filter(t => t.key.toLowerCase().includes(search));
    }

    if (filters.isActive !== undefined) {
      const isActive = filters.isActive === 'true';
      result = result.filter(t => t.isActive === isActive);
    }

    return result.sort((a, b) => a.key.localeCompare(b.key));
  });

  async load(): Promise<void> {
    try {
      this.loadingState.set(true);
      this.errorState.set(null);
      const templates = await this.repository.getAll();
      this.templatesState.set(templates);
    } catch (error) {
      this.errorState.set((error as Error).message);
    } finally {
      this.loadingState.set(false);
    }
  }

  applyFilters(filters: EmailTemplateFilters): void {
    this.filtersState.set(filters);
  }

  clearFilters(): void {
    this.filtersState.set({});
  }

  async updateTemplate(id: string, changes: Partial<EmailTemplate>): Promise<boolean> {
    try {
      this.savingState.set(true);
      this.errorState.set(null);

      const updated = await this.repository.update(id, changes);
      const next = this.templatesState().map(item => item.id === updated.id ? updated : item);
      this.templatesState.set(next);

      return true;
    } catch (error) {
      this.errorState.set((error as Error).message);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }
}
