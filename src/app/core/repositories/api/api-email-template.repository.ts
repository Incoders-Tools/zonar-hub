import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { EmailTemplate } from '../../models';
import { EmailTemplateRepository } from '../email-template.repository';
import { extractApiErrorCode } from './api-error.util';

interface EmailTemplateApiDto {
  id: string;
  key: string;
  subject: string;
  htmlBody: string;
  description: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface EmailTemplateListResponse {
  items: EmailTemplateApiDto[];
}

interface EmailTemplateUpdateRequest {
  subject: string;
  htmlBody: string;
  description: string | null;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiEmailTemplateRepository implements EmailTemplateRepository {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private get endpoint(): string {
    return `${this.apiBaseUrl}/admin/email-templates`;
  }

  async getAll(): Promise<EmailTemplate[]> {
    try {
      const response = await firstValueFrom(this.http.get<EmailTemplateListResponse>(this.endpoint));
      return response.items.map(row => this.toModel(row));
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  async getById(id: string): Promise<EmailTemplate | undefined> {
    try {
      const row = await firstValueFrom(this.http.get<EmailTemplateApiDto>(`${this.endpoint}/${id}`));
      return this.toModel(row);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return undefined;
      }

      throw new Error(extractApiErrorCode(error));
    }
  }

  async update(id: string, changes: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error('common.notFound');
    }

    try {
      const request: EmailTemplateUpdateRequest = {
        subject: changes.subject ?? current.subject,
        htmlBody: changes.htmlBody ?? current.htmlBody,
        description: changes.description ?? current.description,
        isActive: changes.isActive ?? current.isActive
      };

      const updated = await firstValueFrom(
        this.http.put<EmailTemplateApiDto>(`${this.endpoint}/${id}`, request)
      );

      return this.toModel(updated);
    } catch (error) {
      throw new Error(extractApiErrorCode(error));
    }
  }

  private toModel(dto: EmailTemplateApiDto): EmailTemplate {
    return {
      id: dto.id,
      key: dto.key,
      subject: dto.subject,
      htmlBody: dto.htmlBody,
      description: dto.description,
      isActive: dto.isActive,
      createdAt: dto.createdAtUtc,
      updatedAt: dto.updatedAtUtc
    };
  }
}
