export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogOrigin = 'frontend' | 'backend' | 'edge' | 'system';

export interface AppLog {
  id: string;
  createdAt: string;
  level: LogLevel;
  origin: LogOrigin;
  category: string;
  message: string;
  stack?: string;
  route?: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: string;
}
