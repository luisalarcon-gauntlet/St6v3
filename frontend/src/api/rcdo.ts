import client from './client';
import type { RallyCry } from '@/types/domain';

export function getRcdoTree(): Promise<RallyCry[]> {
  return client.get<RallyCry[]>('/api/v1/rcdo/tree').then((r) => r.data);
}
