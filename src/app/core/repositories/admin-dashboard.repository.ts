import { AdminDashboardSummary } from '../models';

export interface AdminDashboardRepository {
  getSummary(organizationId: string): Promise<AdminDashboardSummary>;
}
