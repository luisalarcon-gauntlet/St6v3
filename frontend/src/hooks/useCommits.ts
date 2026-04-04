import { useCallback, useState } from 'react';
import type { WeeklyCommit } from '@/types/domain';
import type { CreateCommitRequest, ReconcileCommitRequest } from '@/types/api';
import { createCommit, deleteCommit, reconcileCommit } from '@/api/commits';
import { normalizeError } from '@/api/client';
import type { AppError } from '@/types/errors';

interface UseCommitsReturn {
  creating: boolean;
  error: AppError | null;
  add: (cycleId: string, data: CreateCommitRequest) => Promise<WeeklyCommit>;
  remove: (id: string) => Promise<void>;
  reconcile: (id: string, data: ReconcileCommitRequest) => Promise<WeeklyCommit>;
}

export function useCommits(): UseCommitsReturn {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const add = useCallback(async (cycleId: string, data: CreateCommitRequest) => {
    setCreating(true);
    setError(null);
    try {
      return await createCommit(cycleId, data);
    } catch (err) {
      const appError = normalizeError(err);
      setError(appError);
      throw appError;
    } finally {
      setCreating(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteCommit(id);
    } catch (err) {
      const appError = normalizeError(err);
      setError(appError);
      throw appError;
    }
  }, []);

  const doReconcile = useCallback(async (id: string, data: ReconcileCommitRequest) => {
    setError(null);
    try {
      return await reconcileCommit(id, data);
    } catch (err) {
      const appError = normalizeError(err);
      setError(appError);
      throw appError;
    }
  }, []);

  return { creating, error, add, remove, reconcile: doReconcile };
}
