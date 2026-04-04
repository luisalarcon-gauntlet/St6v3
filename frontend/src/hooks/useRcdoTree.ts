import { useEffect, useState } from 'react';
import type { RallyCry } from '@/types/domain';
import { getRcdoTree } from '@/api/rcdo';
import { normalizeError } from '@/api/client';
import type { AppError } from '@/types/errors';

interface UseRcdoTreeReturn {
  tree: RallyCry[];
  loading: boolean;
  error: AppError | null;
}

export function useRcdoTree(): UseRcdoTreeReturn {
  const [tree, setTree] = useState<RallyCry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRcdoTree()
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch((err) => {
        if (!cancelled) setError(normalizeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tree, loading, error };
}
