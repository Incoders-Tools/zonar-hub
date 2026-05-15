import { Injectable, Injector, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthSession, LoginRequest, RegisterRequest, Tenant, User, UserRole } from '../models';
import { extractApiErrorCode } from '../repositories/api/api-error.util';
import { ImpersonationService } from '../impersonation/impersonation.service';

interface ApiTenantDto {
  id: string;
  name: string;
  key: string;
  contactEmail: string;
  planId: string;
  planType: string;
}

interface ApiUserDto {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phone?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  tenantId?: string | null;
  tenantIds?: string[] | null;
  organizationId?: string | null;
  locale?: string | null;
  dateFormat?: string | null;
}

interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAtUtc: string;
  user: ApiUserDto;
  tenant?: ApiTenantDto | null;
}

const SESSION_STORAGE_KEY = 'zh_auth_session';
const TENANT_SESSION_KEY = 'zh_auth_session_tenant';
const AUTH_REQUEST_TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /**
   * ImpersonationService injected lazily via Injector to avoid circular DI.
   * AuthService → ImpersonationService ← ApiImpersonationRepository → ImpersonationService
   * The lazy pattern breaks the compile-time cycle.
   */
  private readonly injector = inject(Injector);
  private _imp: ImpersonationService | null = null;
  private get imp(): ImpersonationService {
    if (!this._imp) {
      this._imp = this.injector.get(ImpersonationService);
    }
    return this._imp;
  }

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);

  /**
   * The real authenticated user (the human sysadmin who logged in).
   * Never changes during an impersonation session.
   * Use this wherever the intent is "who is the actual human operator".
   */
  readonly realUser = computed(() => this.sessionState()?.user ?? null);

  /**
   * The EFFECTIVE user — the impersonated target when an impersonation session
   * is active, otherwise the real user. All downstream UI and permission checks
   * should read this signal (they see the target's identity transparently).
   */
  readonly currentUser = computed<User | null>(() => {
    const target = this.imp.target();
    if (target) {
      // Map ImpersonationTarget → User shape for downstream consumers
      return {
        id: target.id,
        fullName: target.fullName,
        email: target.email,
        role: target.role as UserRole,
        roleId: '',          // not available in imp token; downstream that needs roleId should use realUser()
        isActive: true,
        tenantId: target.tenantId,
        createdAt: ''        // not available in imp token
      } satisfies User;
    }
    return this.sessionState()?.user ?? null;
  });

  /** Whether an impersonation session is currently active. */
  readonly isImpersonating = computed(() => this.imp.active());

  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  readonly isSystemAdmin = computed(() => this.userRole() === 'system_admin');
  readonly isAdmin = computed(() => this.userRole() === 'admin' || this.userRole() === 'system_admin');
  readonly isPlayer = computed(() => this.userRole() === 'player');

  constructor() {
    const stored = this.restoreSession();
    if (!stored) {
      return;
    }

    this.setSession(stored);
  }

  async login(request: LoginRequest): Promise<AuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthApiResponse>(`${this.apiBaseUrl}/auth/login`, request)
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );

      return this.buildAndSetSession(response);
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.invalidCredentials'));
    }
  }

  async register(request: RegisterRequest): Promise<AuthSession> {
    try {
      const body = {
        fullName: request.fullName,
        email: request.email,
        password: request.password,
        phone: request.phone ?? null,
        birthDate: request.birthDate ?? null,
        verificationCode: request.verificationCode
      };

      const response = await firstValueFrom(
        this.http.post<AuthApiResponse>(`${this.apiBaseUrl}/auth/register`, body)
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );

      return this.buildAndSetSession(response);
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.registerError'));
    }
  }

  async sendVerificationCode(email: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/auth/send-verification-code`, { email })
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'verification.sendError'));
    }
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ valid: boolean }>(`${this.apiBaseUrl}/auth/check-code`, { email, code })
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
      return result.valid;
    } catch {
      return false;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.get<{ exists: boolean }>(`${this.apiBaseUrl}/auth/check-email`, {
          params: { email }
        }).pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
      return result.exists;
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.registerError'));
    }
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.get<{ exists: boolean }>(`${this.apiBaseUrl}/auth/check-phone`, {
          params: { phone }
        }).pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
      return result.exists;
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.registerError'));
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const resetUrlBase = `${window.location.origin}/reset-password`;
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/auth/forgot-password`, { email, resetUrlBase })
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.resetError'));
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/auth/reset-password`, { token, newPassword: password })
          .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS))
      );
    } catch (error) {
      throw new Error(extractApiErrorCode(error, 'auth.resetError'));
    }
  }

  logout(): void {
    this.sessionState.set(null);
    this.clearSessionStorage();
    this.clearTenantStorage();
  }

  updateCurrentOrganization(organizationId: string, organizationName?: string): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    const updated: AuthSession = {
      ...current,
      user: {
        ...current.user,
        organizationId
      },
      organizationId,
      organizationName: organizationName ?? current.organizationName
    };

    this.setSession(updated);
  }

  updateCurrentOrganizationAssignments(organizationId?: string, tenantIds?: string[]): void {
    const current = this.sessionState();
    if (!current) {
      return;
    }

    const nextOrgId = organizationId ?? current.user.organizationId;

    const updated: AuthSession = {
      ...current,
      user: {
        ...current.user,
        organizationId: nextOrgId,
        tenantIds: tenantIds ?? current.user.tenantIds
      },
      organizationId: nextOrgId
    };

    this.setSession(updated);
  }

  updateTenantContext(tenantId?: string | null): void {
    try {
      if (tenantId) {
        localStorage.setItem(TENANT_SESSION_KEY, tenantId);
      } else {
        localStorage.removeItem(TENANT_SESSION_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  private buildAndSetSession(response: AuthApiResponse): AuthSession {
    const user = this.mapApiUser(response.user);
    const tenant = response.tenant ? this.mapApiTenant(response.tenant) : undefined;
    const session: AuthSession = {
      user,
      token: response.accessToken,
      expiresAt: response.expiresAtUtc,
      tenant,
      organizationId: user.organizationId,
      organizationName: tenant?.name
    };

    this.setSession(session);
    return session;
  }

  private setSession(session: AuthSession): void {
    this.sessionState.set(session);

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      const tenantId = session.user.tenantId ?? session.tenant?.id;
      if (tenantId) {
        localStorage.setItem(TENANT_SESSION_KEY, tenantId);
      } else {
        localStorage.removeItem(TENANT_SESSION_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  private clearSessionStorage(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }

  private clearTenantStorage(): void {
    try {
      localStorage.removeItem(TENANT_SESSION_KEY);
    } catch {
      // storage unavailable
    }
  }

  private restoreSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (!parsed || !parsed.user || !parsed.token || !parsed.expiresAt) {
        return null;
      }

      return parsed as AuthSession;
    } catch {
      return null;
    }
  }

  private mapApiUser(user: ApiUserDto): User {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? undefined,
      birthDate: user.birthDate ?? undefined,
      roleId: user.roleId,
      role: this.toUserRole(user.role),
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? undefined,
      tenantId: user.tenantId ?? undefined,
      tenantIds: user.tenantIds ?? undefined,
      organizationId: user.organizationId ?? undefined,
      locale: user.locale ?? undefined,
      dateFormat: user.dateFormat ?? undefined,
      createdAt: user.createdAt
    };
  }

  private mapApiTenant(t: ApiTenantDto): Tenant {
    return {
      id: t.id,
      name: t.name,
      key: t.key,
      contactEmail: t.contactEmail,
      planId: t.planId,
      planType: t.planType as Tenant['planType'],
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }

  private toUserRole(role: string): UserRole {
    if (role === 'system_admin' || role === 'admin' || role === 'editor' || role === 'player' || role === 'viewer') {
      return role;
    }

    return 'user';
  }
}
