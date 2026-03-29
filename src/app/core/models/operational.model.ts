export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface ProcessExecution {
  id: string;
  processName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  resultSummary?: string;
  triggeredBy: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SecurityAttemptGuard {
  id: string;
  identifier: string;
  attemptType: string;
  attemptCount: number;
  lastAttemptAt: string;
  isBlocked: boolean;
  blockedUntil?: string;
}
