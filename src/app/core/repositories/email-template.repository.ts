import { EmailTemplate } from '../models';

export interface EmailTemplateRepository {
  getAll(): Promise<EmailTemplate[]>;
  getById(id: string): Promise<EmailTemplate | undefined>;
  update(id: string, changes: Partial<EmailTemplate>): Promise<EmailTemplate>;
}
