import { useCallback, useEffect, useState } from 'react';
import type { WeeklyCycle } from '@/types/domain';
import { getCurrentCycle, lockCycle, startReconciliation, reconcileCycle } from '@/api/cycles';
import { normalizeError } from '@/api/client';
import type { AppError } from '@/types/errors';

interface UseCycleReturn {
  cycle: WeeklyCycle | null;
  loading: boolean;
  error: AppError | null;
  reload: () => void;
  lock: () => Promise<void>;
  beginReconciliation: () => Promise<void>;
  reconcile: () => Promise<void>;
}

export function useCycle(): UseCycleReturn {
  const [cycle, setCycle] = useState<WeeklyCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getCurrentCycle()
      .then(setCycle)
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lock = useCallback(async () => {
    if (!cycle) return;
    try {
      const updated = await lockCycle(cycle.id, cycle.version);
      setCycle(updated);
    } catch (err) {
      throw normalizeError(err);
    }
  }, [cycle]);

  const beginReconciliation = useCallback(async () => {
    if (!cycle) return;
    try {
      const updated = await startReconciliation(cycle.id, cycle.version);
      setCycle(updated);
    } catch (err) {
      throw normalizeError(err);
    }
  }, [cycle]);

  const doReconcile = useCallback(async () => {
    if (!cycle) return;
    try {
      const updated = await reconcileCycle(cycle.id, cycle.version);
      setCycle(updated);
    } catch (err) {
      throw normalizeError(err);
    }
  }, [cycle]);

  return {
    cycle,
    loading,
    error,
    reload: load,
    lock,
    beginReconciliation,
    reconcile: doReconcile,
  };
}
