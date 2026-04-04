import client from './client';
import type { WeeklyCommit } from '@/types/domain';
import type { CreateCommitRequest, UpdateCommitRequest, ReconcileCommitRequest } from '@/types/api';

export function createCommit(
  cycleId: string,
  data: CreateCommitRequest,
): Promise<WeeklyCommit> {
  return client
    .post<WeeklyCommit>(`/api/v1/cycles/${cycleId}/commits`, data)
    .then((r) => r.data);
}

export function updateCommit(
  id: string,
  data: UpdateCommitRequest,
): Promise<WeeklyCommit> {
  return client.put<WeeklyCommit>(`/api/v1/commits/${id}`, data).then((r) => r.data);
}

export function deleteCommit(id: string): Promise<void> {
  return client.delete(`/api/v1/commits/${id}`).then(() => undefined);
}

export function reconcileCommit(
  id: string,
  data: ReconcileCommitRequest,
): Promise<WeeklyCommit> {
  return client
    .put<WeeklyCommit>(`/api/v1/commits/${id}/reconcile`, data)
    .then((r) => r.data);
}
