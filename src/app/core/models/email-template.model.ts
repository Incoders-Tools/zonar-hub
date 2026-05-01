export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
