import { Injectable } from '@angular/core';
import { Role, RoleCreatePayload, RoleUpdatePayload, SYSTEM_ROLE_NAMES, isSystemRole } from '../../models';
import { RoleRepository } from '../role.repository';
import { globalStorageKey, persistToStorage, loadFromStorage } from '../../data/mock/mock-persistence';

const STORAGE_COLLECTION = 'roles';

interface RoleStorageState { data: Role[]; nextId: number; }

const SEED_ROLES: Role[] = [
  { id: '1', name: 'system_admin', description: 'Full system access with all permissions', isActive: true, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: '2', name: 'admin', description: 'Administrative access to manage content', isActive: true, createdAt: new Date('2025-01-02'), updatedAt: new Date('2025-01-02') },
  { id: '3', name: 'user', description: 'Standard user with limited permissions', isActive: true, createdAt: new Date('2025-01-03'), updatedAt: new Date('2025-01-03') },
  { id: '4', name: 'viewer', description: 'Read-only access', isActive: true, createdAt: new Date('2025-01-04'), updatedAt: new Date('2025-01-04') },
  { id: '5', name: 'editor', description: 'Content editor with publish permissions', isActive: false, createdAt: new Date('2025-01-05'), updatedAt: new Date('2025-02-01') }
];

@Injectable({
  providedIn: 'root'
})
export class MockRoleRepository extends RoleRepository {
  private roles: Role[];
  private nextId: number;

  constructor() {
    super();
    const stored = loadFromStorage<RoleStorageState>(globalStorageKey(STORAGE_COLLECTION));
    if (stored) {
      this.roles = stored.data.map(r => ({ ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) }));
      this.nextId = stored.nextId;
    } else {
      this.roles = structuredClone(SEED_ROLES);
      this.nextId = 6;
    }
  }

  private persist(): void {
    persistToStorage(globalStorageKey(STORAGE_COLLECTION), { data: this.roles, nextId: this.nextId });
  }

  /**
   * Retrieves all roles with simulated delay
   */
  async getAll(): Promise<Role[]> {
    await this.simulateDelay();
    return JSON.parse(JSON.stringify(this.roles));
  }

  /**
   * Retrieves a single role by ID
   * Throws error if role not found
   */
  async getById(id: string): Promise<Role> {
    await this.simulateDelay();
    const role = this.roles.find(r => r.id === id);
    if (!role) {
      throw new Error(`Role with ID ${id} not found`);
    }
    return JSON.parse(JSON.stringify(role));
  }

  /**
   * Creates a new role
   * Validates: name uniqueness, non-system role names
   */
  async create(data: RoleCreatePayload): Promise<Role> {
    await this.simulateDelay();

    // Validate name uniqueness
    if (this.roles.some(r => r.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error(`Role name "${data.name}" already exists`);
    }

    // Prevent creation of system roles
    if (isSystemRole(data.name)) {
      throw new Error(`Cannot create system role "${data.name}". System roles are predefined.`);
    }

    const newRole: Role = {
      id: String(this.nextId++),
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.push(newRole);
    this.persist();
    return JSON.parse(JSON.stringify(newRole));
  }

  /**
   * Updates an existing role
   * Validates: name uniqueness (excluding current role), prevents system role modification
   */
  async update(id: string, data: RoleUpdatePayload): Promise<Role> {
    await this.simulateDelay();

    const roleIndex = this.roles.findIndex(r => r.id === id);
    if (roleIndex === -1) {
      throw new Error(`Role with ID ${id} not found`);
    }

    const currentRole = this.roles[roleIndex];

    // Prevent modification of system roles
    if (isSystemRole(currentRole.name)) {
      throw new Error(`Cannot modify system role "${currentRole.name}". System roles are immutable.`);
    }

    // Validate name uniqueness if name is being changed
    if (data.name && data.name !== currentRole.name) {
      if (this.roles.some(r => r.id !== id && r.name.toLowerCase() === (data.name ?? '').toLowerCase())) {
        throw new Error(`Role name "${data.name}" already exists`);
      }
    }

    // Update fields
    const updatedRole: Role = {
      ...currentRole,
      ...data,
      id: currentRole.id, // Ensure ID doesn't change
      createdAt: currentRole.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    this.roles[roleIndex] = updatedRole;
    this.persist();
    return JSON.parse(JSON.stringify(updatedRole));
  }

  /**
   * Deletes a role by ID
   * Validates: prevents system role deletion
   */
  async delete(id: string): Promise<void> {
    await this.simulateDelay();

    const roleIndex = this.roles.findIndex(r => r.id === id);
    if (roleIndex === -1) {
      throw new Error(`Role with ID ${id} not found`);
    }

    const role = this.roles[roleIndex];

    // Prevent deletion of system roles
    if (isSystemRole(role.name)) {
      throw new Error(`Cannot delete system role "${role.name}". System roles are immutable.`);
    }

    this.roles.splice(roleIndex, 1);
    this.persist();
  }

  /**
   * Helper: Simulates network delay (200-400ms)
   */
  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => {
      const delay = Math.random() * 200 + 200;
      setTimeout(resolve, delay);
    });
  }
}
