import { TestBed } from '@angular/core/testing';
import { EmailTemplate } from '../../../../core/models';
import { ApiEmailTemplateRepository } from '../../../../core/repositories/api/api-email-template.repository';
import { EmailTemplatesFacadeService } from './email-templates-facade.service';

describe('EmailTemplatesFacadeService', () => {
  let service: EmailTemplatesFacadeService;
  let repositorySpy: jasmine.SpyObj<ApiEmailTemplateRepository>;

  const seeded: EmailTemplate[] = [
    {
      id: '1',
      key: 'auth.verification_code',
      subject: 'Verification',
      htmlBody: '<p>{{code}}</p>',
      description: 'verification',
      isActive: true,
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z'
    },
    {
      id: '2',
      key: 'auth.password_reset',
      subject: 'Reset',
      htmlBody: '<p>{{reset_link}}</p>',
      description: 'reset',
      isActive: false,
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<ApiEmailTemplateRepository>('ApiEmailTemplateRepository', ['getAll', 'update']);

    TestBed.configureTestingModule({
      providers: [
        EmailTemplatesFacadeService,
        { provide: ApiEmailTemplateRepository, useValue: repositorySpy }
      ]
    });

    service = TestBed.inject(EmailTemplatesFacadeService);
  });

  it('loads templates', async () => {
    repositorySpy.getAll.and.resolveTo(seeded);

    await service.load();

    expect(service.templates().length).toBe(2);
    expect(service.error()).toBeNull();
  });

  it('filters by active state', async () => {
    repositorySpy.getAll.and.resolveTo(seeded);
    await service.load();

    service.applyFilters({ isActive: 'true' });

    expect(service.filteredTemplates().length).toBe(1);
    expect(service.filteredTemplates()[0].key).toBe('auth.verification_code');
  });

  it('updates a template', async () => {
    repositorySpy.getAll.and.resolveTo(seeded);
    repositorySpy.update.and.resolveTo({ ...seeded[0], subject: 'Updated subject' });

    await service.load();
    const ok = await service.updateTemplate('1', { subject: 'Updated subject' });

    expect(ok).toBeTrue();
    expect(service.templates()[0].subject).toBe('Updated subject');
  });
});
