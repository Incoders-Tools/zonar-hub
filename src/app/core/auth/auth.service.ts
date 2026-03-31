import { Injectable, signal, computed } from '@angular/core';
import { AuthSession, LoginRequest, RegisterRequest, User, UserRole } from '../models';
import { MOCK_USERS } from '../data/mock/mock-users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<AuthSession | null>(null);

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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    this.sessionState.set(session);
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
      role: 'player',
      roleId: 'role2',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    const session: AuthSession = {
      user: newUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    this.sessionState.set(session);
    return session;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.delay(800);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.delay(800);
  }

  logout(): void {
    this.sessionState.set(null);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
