import client from './client';
import type { WeeklyCycle } from '@/types/domain';
import type { PageResponse } from '@/types/api';

export function getCurrentCycle(): Promise<WeeklyCycle> {
  return client.get<WeeklyCycle>('/api/v1/cycles/current').then((r) => r.data);
}

export function getCycle(id: string): Promise<WeeklyCycle> {
  return client.get<WeeklyCycle>(`/api/v1/cycles/${id}`).then((r) => r.data);
}

export function getCycles(page = 0, size = 20): Promise<PageResponse<WeeklyCycle>> {
  return client
    .get<PageResponse<WeeklyCycle>>('/api/v1/cycles', { params: { page, size } })
    .then((r) => r.data);
}

export function lockCycle(id: string, version: number): Promise<WeeklyCycle> {
  return client
    .post<WeeklyCycle>(`/api/v1/cycles/${id}/lock`, { version })
    .then((r) => r.data);
}

export function startReconciliation(id: string, version: number): Promise<WeeklyCycle> {
  return client
    .post<WeeklyCycle>(`/api/v1/cycles/${id}/start-reconciliation`, { version })
    .then((r) => r.data);
}

export function reconcileCycle(id: string, version: number): Promise<WeeklyCycle> {
  return client
    .post<WeeklyCycle>(`/api/v1/cycles/${id}/reconcile`, { version })
    .then((r) => r.data);
}
