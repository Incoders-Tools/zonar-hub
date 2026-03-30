import { AppLog } from '../../models/app-log.model';

export const MOCK_APP_LOGS: AppLog[] = [
  {
    id: 'log001',
    createdAt: new Date(Date.now() - 1000).toISOString(),
    level: 'info',
    origin: 'frontend',
    category: 'auth.login',
    message: 'User logged in successfully',
    component: 'LoginPageComponent',
    route: '/login',
    userId: 'usr001',
    resolved: true,
    resolvedAt: new Date().toISOString()
  },
  {
    id: 'log002',
    createdAt: new Date(Date.now() - 5000).toISOString(),
    level: 'warn',
    origin: 'frontend',
    category: 'tournaments.list.load',
    message: 'Slow network detected - took 2.5s to load tournaments',
    component: 'TournamentListPageComponent',
    route: '/tournaments',
    resolved: false
  },
  {
    id: 'log003',
    createdAt: new Date(Date.now() - 10000).toISOString(),
    level: 'error',
    origin: 'backend',
    category: 'api.registration.create',
    message: 'Duplicate registration attempt detected',
    stack: 'Error: Unique constraint failed on (tournament_id, user_id)\n  at verifyUnique (db.js:145:22)',
    metadata: { tournamentId: 'tourn456', userId: 'usr002' },
    resolved: true,
    resolvedAt: new Date(Date.now() - 2000).toISOString()
  },
  {
    id: 'log004',
    createdAt: new Date(Date.now() - 15000).toISOString(),
    level: 'debug',
    origin: 'frontend',
    category: 'api.call',
    message: 'API Request to /api/tournaments?page=1&limit=10',
    component: 'AdminTournamentsPageComponent',
    route: '/admin/tournaments',
    resolved: true,
    resolvedAt: new Date(Date.now() - 10000).toISOString()
  },
  {
    id: 'log005',
    createdAt: new Date(Date.now() - 30000).toISOString(),
    level: 'error',
    origin: 'backend',
    category: 'database.query',
    message: 'Database connection timeout after 30s',
    stack: 'TimeoutError: Query exceeded maximum execution time\n  at executeQuery (query.js:89:22)',
    resolved: false
  },
  {
    id: 'log006',
    createdAt: new Date(Date.now() - 45000).toISOString(),
    level: 'warn',
    origin: 'system',
    category: 'infrastructure.disk',
    message: 'Disk usage at 85% capacity',
    metadata: { diskUsage: '85%', threshold: '80%' },
    resolved: false
  },
  {
    id: 'log007',
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    level: 'info',
    origin: 'backend',
    category: 'cron.cleanup',
    message: 'Cleanup job executed - removed 245 old sessions',
    metadata: { removedRecords: 245, duration: '1.2s' },
    resolved: true,
    resolvedAt: new Date(Date.now() - 50000).toISOString()
  },
  {
    id: 'log008',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    level: 'error',
    origin: 'frontend',
    category: 'validation.form',
    message: 'Email validation failed: invalid format',
    component: 'UsersFormComponent',
    route: '/admin/system/users',
    metadata: { email: 'invalid-email@', errorCode: 'INVALID_EMAIL_FORMAT' },
    resolved: true,
    resolvedAt: new Date(Date.now() - 90000).toISOString()
  },
  {
    id: 'log009',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    level: 'fatal',
    origin: 'backend',
    category: 'payment.processor',
    message: 'Payment gateway unreachable - service critical',
    stack: 'ConnectionError: Cannot reach payment service at 3.14.159.265:8443\n  at connectPaymentGateway (payment.js:42:22)',
    metadata: { serviceUrl: '3.14.159.265:8443', retries: 3 },
    resolved: false
  },
  {
    id: 'log010',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    level: 'info',
    origin: 'frontend',
    category: 'ui.navigation',
    message: 'User navigated to /admin/system/audit',
    component: 'AdminLayoutComponent',
    route: '/admin/system/audit',
    userId: 'usr123',
    resolved: true,
    resolvedAt: new Date(Date.now() - 4 * 60000).toISOString()
  }
];
