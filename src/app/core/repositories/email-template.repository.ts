import { EmailTemplate } from '../models';

export interface EmailTemplateRepository {
  getAll(): Promise<EmailTemplate[]>;
  getById(id: string): Promise<EmailTemplate | undefined>;
  create(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>;
  update(id: string, changes: Partial<EmailTemplate>): Promise<EmailTemplate>;
  delete(id: string): Promise<void>;
}
