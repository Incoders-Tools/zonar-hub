import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApiEmailTemplateRepository } from '../../../../core/repositories/api/api-email-template.repository';
import { AdminEmailTemplatesPageComponent } from './admin-email-templates-page.component';

describe('AdminEmailTemplatesPageComponent', () => {
  let component: AdminEmailTemplatesPageComponent;
  let fixture: ComponentFixture<AdminEmailTemplatesPageComponent>;
  let repositorySpy: jasmine.SpyObj<ApiEmailTemplateRepository>;

  beforeEach(async () => {
    repositorySpy = jasmine.createSpyObj<ApiEmailTemplateRepository>('ApiEmailTemplateRepository', ['getAll', 'getById', 'update']);
    repositorySpy.getAll.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [AdminEmailTemplatesPageComponent, NoopAnimationsModule],
      providers: [{ provide: ApiEmailTemplateRepository, useValue: repositorySpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEmailTemplatesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('opens editor panel when selecting a row', async () => {
    repositorySpy.getAll.and.resolveTo([
      {
        id: '1',
        key: 'auth.verification_code',
        subject: 'Code',
        htmlBody: '<p>{{code}}</p>',
        description: null,
        isActive: true,
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]);

    await component.facade.load();

    component.openEdit('1');

    expect(component.showFormPanel()).toBeTrue();
    expect(component.editingTemplate()?.key).toBe('auth.verification_code');
  });
});
