import { User } from '../../models';

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@zonar.com', fullName: 'Admin Principal', role: 'admin', roleId: 'role1', isActive: true, createdAt: '2025-01-01' },
  { id: 'u2', email: 'martin@test.com', fullName: 'Martín García', role: 'player', roleId: 'role2', isActive: true, phone: '+5491155001234', createdAt: '2025-06-01' },
  { id: 'u3', email: 'sofia@test.com', fullName: 'Sofía López', role: 'player', roleId: 'role2', isActive: true, createdAt: '2025-07-01' }
];
