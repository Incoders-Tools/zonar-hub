import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { API_BASE_URL } from '../../config/api-base-url.token';
import { AdminUserCreatePayload, AdminUserUpdatePayload } from '../../models/admin-user.model';
import { ApiAdminUserRepository } from './api-admin-user.repository';

describe('ApiAdminUserRepository', () => {
  let repository: ApiAdminUserRepository;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ApiAdminUserRepository,
        { provide: HttpClient, useValue: httpClient },
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    });

    repository = TestBed.inject(ApiAdminUserRepository);
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  it('getAll should request paged endpoint and map DTO fields', async () => {
    httpClient.get.and.returnValue(of({
      items: [
        {
          id: 'u-1',
          email: 'admin@zonarhub.dev',
          fullName: 'Admin User',
          role: 'admin',
          roleId: 'role002',
          roleName: 'admin',
          organizationId: 'org-1',
          organizationName: 'Org 1',
          tenantIds: ['org-1', 'org-2'],
          tenantNames: ['Org 1', 'Org 2'],
          isActive: true,
          createdAtUtc: '2026-05-01T09:00:00Z',
          updatedAtUtc: '2026-05-01T09:30:00Z'
        }
      ],
      page: 1,
      pageSize: 200,
      totalCount: 1
    }));

    const result = await repository.getAll();

    expect(httpClient.get).toHaveBeenCalledWith('/api/admin/users?page=1&pageSize=200');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('u-1');
    expect(result[0].organizationName).toBe('Org 1');
    expect(result[0].tenantIds).toEqual(['org-1', 'org-2']);
    expect(result[0].createdAt).toBe('2026-05-01T09:00:00Z');
    expect(result[0].updatedAt).toBe('2026-05-01T09:30:00Z');
  });

  it('create should post payload and map response', async () => {
    const payload: AdminUserCreatePayload = {
      email: 'new@zonarhub.dev',
      fullName: 'New User',
      roleId: 'role002',
      organizationId: 'org-1',
      tenantIds: ['org-1'],
      password: 'Secret-123'
    };

    httpClient.post.and.returnValue(of({
      id: 'u-2',
      email: payload.email,
      fullName: payload.fullName,
      role: 'admin',
      roleId: payload.roleId,
      roleName: 'admin',
      organizationId: payload.organizationId,
      organizationName: 'Org 1',
      tenantIds: payload.tenantIds,
      tenantNames: ['Org 1'],
      isActive: true,
      createdAtUtc: '2026-05-01T10:00:00Z',
      updatedAtUtc: '2026-05-01T10:00:00Z'
    }));

    const created = await repository.create(payload);

    expect(httpClient.post).toHaveBeenCalledWith('/api/admin/users', {
      email: payload.email,
      fullName: payload.fullName,
      phone: payload.phone,
      roleId: payload.roleId,
      organizationId: payload.organizationId,
      tenantIds: payload.tenantIds,
      password: payload.password
    });
    expect(created.id).toBe('u-2');
    expect(created.email).toBe(payload.email);
    expect(created.tenantNames).toEqual(['Org 1']);
  });

  it('update should put payload and map response', async () => {
    const payload: AdminUserUpdatePayload = {
      fullName: 'Updated User',
      roleId: 'role003',
      organizationId: 'org-2',
      tenantIds: ['org-2'],
      isActive: false
    };

    httpClient.put.and.returnValue(of({
      id: 'u-2',
      email: 'new@zonarhub.dev',
      fullName: payload.fullName,
      role: 'viewer',
      roleId: payload.roleId,
      roleName: 'viewer',
      organizationId: payload.organizationId,
      organizationName: 'Org 2',
      tenantIds: payload.tenantIds,
      tenantNames: ['Org 2'],
      isActive: false,
      createdAtUtc: '2026-05-01T10:00:00Z',
      updatedAtUtc: '2026-05-01T11:00:00Z'
    }));

    const updated = await repository.update('u-2', payload);

    expect(httpClient.put).toHaveBeenCalledWith('/api/admin/users/u-2', {
      fullName: payload.fullName,
      phone: payload.phone,
      roleId: payload.roleId,
      organizationId: payload.organizationId,
      tenantIds: payload.tenantIds,
      isActive: payload.isActive
    });
    expect(updated.roleId).toBe('role003');
    expect(updated.organizationId).toBe('org-2');
    expect(updated.isActive).toBeFalse();
  });

  it('deleteMany should delegate delete for every id', async () => {
    spyOn(repository, 'delete').and.resolveTo();

    await repository.deleteMany(['u-1', 'u-2', 'u-3']);

    expect(repository.delete).toHaveBeenCalledTimes(3);
    expect(repository.delete).toHaveBeenCalledWith('u-1');
    expect(repository.delete).toHaveBeenCalledWith('u-2');
    expect(repository.delete).toHaveBeenCalledWith('u-3');
  });

  it('getAll should convert API error code into thrown error message', async () => {
    httpClient.get.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { code: 'admin_users.forbidden' }
    })));

    await expectAsync(repository.getAll()).toBeRejectedWithError('admin_users.forbidden');
  });
});
