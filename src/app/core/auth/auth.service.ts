import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthSession, LoginRequest, RegisterRequest, Tenant, User, UserRole } from '../models';
import { MOCK_USERS } from '../data/mock/mock-users';
import { setCurrentMockTenant } from '../data/mock/mock-tenant-context';
import { MockAdminUserRepository } from '../repositories/mock/mock-admin-user.repository';

const MOCK_TENANT: Tenant = {
  id: 'tenant-1',
  name: 'Club Padel Barcelona',
  key: 'club_padel_bcn',
  contactEmail: 'info@clubpadelbcn.com',
  contactPhone: '+34 93 123 4567',
  planId: 'plan-2',
  planType: 'pro',
  isActive: true,
  createdAt: '2025-01-15'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly adminUserRepo = inject(MockAdminUserRepository);

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly userRole = computed<UserRole | null>(() => this.currentUser()?.role ?? null);
  readonly isSystemAdmin = computed(() => this.userRole() === 'system_admin');
  readonly isAdmin = computed(() => this.userRole() === 'admin' || this.userRole() === 'system_admin');
  readonly isPlayer = computed(() => this.userRole() === 'player');

  async login(request: LoginRequest): Promise<AuthSession> {
    await this.delay(800);
    const user = MOCK_USERS.find(u => u.email === request.email);
    if (!user) {
      throw new Error('auth.invalidCredentials');
    }
    const session: AuthSession = {
      user,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tenant: user.tenantId ? MOCK_TENANT : undefined,
      organizationId: user.tenantId ? 'org-1' : undefined,
      organizationName: user.tenantId ? 'Club Padel Barcelona' : undefined
    };
    this.sessionState.set(session);
    setCurrentMockTenant(session.tenant?.id);
    return session;
  }

  async register(request: RegisterRequest): Promise<AuthSession> {
    await this.delay(1000);
    const newUser: User = {
      id: 'u-' + Date.now(),
      email: request.email,
      fullName: request.fullName,
      phone: request.phone,
      birthDate: request.birthDate,
      role: 'admin',
      roleId: 'role1',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    // Persist registered user in localStorage for mock persistence
    this.persistRegisteredUser(newUser);
    const session: AuthSession = {
      user: newUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tenant: {
        ...MOCK_TENANT,
        id: 'tenant-' + Date.now(),
        name: request.fullName + ' Circuit',
        planType: 'starter',
        isActive: true
      },
      organizationId: 'org-' + Date.now(),
      organizationName: request.fullName + ' Circuit'
    };
    this.sessionState.set(session);
    setCurrentMockTenant(session.tenant?.id);

    // Persist user into admin users repository so it appears in ABM lists
    this.adminUserRepo.create({
      email: request.email,
      fullName: request.fullName,
      phone: request.phone,
      roleId: 'role1'
    }).catch(() => { /* silent — mock persistence only */ });

    return session;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    await this.delay(300);
    const registered = this.getRegisteredUsers();
    return MOCK_USERS.some(u => u.email === email) || registered.some((u: User) => u.email === email);
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    await this.delay(300);
    const normalized = phone.replace(/[\s\-()]/g, '');
    const registered = this.getRegisteredUsers();
    return registered.some((u: User) => u.phone?.replace(/[\s\-()]/g, '') === normalized);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.delay(800);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.delay(800);
  }

  logout(): void {
    this.sessionState.set(null);
    setCurrentMockTenant(undefined);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private persistRegisteredUser(user: User): void {
    try {
      const existing = this.getRegisteredUsers();
      existing.push(user);
      localStorage.setItem('zh_registered_users', JSON.stringify(existing));
    } catch {
      // storage unavailable
    }
  }

  private getRegisteredUsers(): User[] {
    try {
      const raw = localStorage.getItem('zh_registered_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
