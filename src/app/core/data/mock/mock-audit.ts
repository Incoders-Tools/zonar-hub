import { AuditLog } from '../../models/operational.model';

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit1',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    userId: 'user123',
    userName: 'Admin User',
    action: 'UPDATE',
    entityType: 'tournaments',
    entityId: 'tourn456',
    details: 'Updated tournament status from draft to active'
  },
  {
    id: 'audit2',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    userId: 'user124',
    userName: 'Manager User',
    action: 'CREATE',
    entityType: 'registrations',
    entityId: 'reg789',
    details: 'Created new registration for Juan Perez'
  },
  {
    id: 'audit3',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    userId: 'user123',
    userName: 'Admin User',
    action: 'DELETE',
    entityType: 'registrations',
    entityId: 'reg750',
    details: 'Deleted registration for Carlos Lopez'
  },
  {
    id: 'audit4',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    userId: 'user125',
    userName: 'Operator User',
    action: 'UPDATE',
    entityType: 'users',
    entityId: 'usr001',
    details: 'Changed user status to inactive and updated roles'
  },
  {
    id: 'audit5',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    userId: 'user126',
    userName: 'System Admin',
    action: 'EXECUTE',
    entityType: 'tournaments',
    entityId: 'tourn456',
    details: 'Executed action: generate_draw'
  },
  {
    id: 'audit6',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    userId: 'user123',
    userName: 'Admin User',
    action: 'RESTORE',
    entityType: 'tournaments',
    entityId: 'tourn400',
    details: 'Restored tournament from backup_20240329'
  },
  {
    id: 'audit7',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    userId: 'user127',
    userName: 'Content Manager',
    action: 'CREATE',
    entityType: 'categories',
    entityId: 'cat001',
    details: 'Created new category: Femenino A'
  },
  {
    id: 'audit8',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    userId: 'user123',
    userName: 'Admin User',
    action: 'UPDATE',
    entityType: 'complexes',
    entityId: 'complex001',
    details: 'Updated complex status to maintenance'
  },
  {
    id: 'audit9',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    userId: 'user128',
    userName: 'Viewer User',
    action: 'DELETE',
    entityType: 'categories',
    entityId: 'cat002',
    details: 'Deleted category: Mixto B'
  },
  {
    id: 'audit10',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    userId: 'user123',
    userName: 'Admin User',
    action: 'CREATE',
    entityType: 'users',
    entityId: 'usr050',
    details: 'Created new user account'
  }
];
