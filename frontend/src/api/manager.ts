import client from './client';
import type { TeamMemberOverview, WeeklyCycle } from '@/types/domain';
import type { PageResponse, ReviewRequest } from '@/types/api';

export function getTeamOverview(page = 0, size = 20): Promise<PageResponse<TeamMemberOverview>> {
  return client
    .get<PageResponse<TeamMemberOverview>>('/api/v1/manager/team', { params: { page, size } })
    .then((r) => r.data);
}

export function getTeamMemberDetail(userId: string): Promise<TeamMemberOverview> {
  return client
    .get<TeamMemberOverview>(`/api/v1/manager/team/${userId}`)
    .then((r) => r.data);
}

export function submitReview(cycleId: string, data: ReviewRequest): Promise<WeeklyCycle> {
  return client
    .post<WeeklyCycle>(`/api/v1/manager/reviews/${cycleId}`, data)
    .then((r) => r.data);
}
