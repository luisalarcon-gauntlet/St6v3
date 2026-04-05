import client from './client';
import type { RallyCry, DefiningObjective, Outcome } from '@/types/domain';
import type {
  CreateRallyCryRequest,
  CreateDefiningObjectiveRequest,
  CreateOutcomeRequest,
  UpdateRcdoRequest,
} from '@/types/api';

export function getRcdoTree(): Promise<RallyCry[]> {
  return client.get<RallyCry[]>('/api/v1/rcdo/tree').then((r) => r.data);
}

export function getRcdoTreeAll(): Promise<RallyCry[]> {
  return client
    .get<RallyCry[]>('/api/v1/rcdo/tree', { params: { includeArchived: true } })
    .then((r) => r.data);
}

export function createRallyCry(data: CreateRallyCryRequest): Promise<RallyCry> {
  return client.post<RallyCry>('/api/v1/rally-cries', data).then((r) => r.data);
}

export function updateRallyCry(id: string, data: UpdateRcdoRequest): Promise<RallyCry> {
  return client.put<RallyCry>(`/api/v1/rally-cries/${id}`, data).then((r) => r.data);
}

export function archiveRallyCry(id: string): Promise<void> {
  return client.delete(`/api/v1/rally-cries/${id}`).then(() => undefined);
}

export function createDefiningObjective(data: CreateDefiningObjectiveRequest): Promise<DefiningObjective> {
  return client.post<DefiningObjective>('/api/v1/defining-objectives', data).then((r) => r.data);
}

export function updateDefiningObjective(id: string, data: UpdateRcdoRequest): Promise<DefiningObjective> {
  return client.put<DefiningObjective>(`/api/v1/defining-objectives/${id}`, data).then((r) => r.data);
}

export function archiveDefiningObjective(id: string): Promise<void> {
  return client.delete(`/api/v1/defining-objectives/${id}`).then(() => undefined);
}

export function createOutcome(data: CreateOutcomeRequest): Promise<Outcome> {
  return client.post<Outcome>('/api/v1/outcomes', data).then((r) => r.data);
}

export function updateOutcome(id: string, data: UpdateRcdoRequest): Promise<Outcome> {
  return client.put<Outcome>(`/api/v1/outcomes/${id}`, data).then((r) => r.data);
}

export function archiveOutcome(id: string): Promise<void> {
  return client.delete(`/api/v1/outcomes/${id}`).then(() => undefined);
}
