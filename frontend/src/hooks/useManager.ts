import { useCallback, useEffect, useState } from 'react';
import type { TeamMemberOverview } from '@/types/domain';
import type { PageResponse, ReviewRequest } from '@/types/api';
import { getTeamOverview, submitReview } from '@/api/manager';
import { normalizeError } from '@/api/client';
import type { AppError } from '@/types/errors';

interface UseManagerReturn {
  team: PageResponse<TeamMemberOverview> | null;
  loading: boolean;
  error: AppError | null;
  page: number;
  setPage: (page: number) => void;
  reload: () => void;
  review: (cycleId: string, data: ReviewRequest) => Promise<void>;
  reviewing: boolean;
  reviewError: AppError | null;
}

export function useManager(): UseManagerReturn {
  const [team, setTeam] = useState<PageResponse<TeamMemberOverview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<AppError | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getTeamOverview(page)
      .then(setTeam)
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(async (cycleId: string, data: ReviewRequest) => {
    setReviewing(true);
    setReviewError(null);
    try {
      await submitReview(cycleId, data);
      load();
    } catch (err) {
      const normalized = normalizeError(err);
      setReviewError(normalized);
      throw normalized;
    } finally {
      setReviewing(false);
    }
  }, [load]);

  return {
    team,
    loading,
    error,
    page,
    setPage,
    reload: load,
    review,
    reviewing,
    reviewError,
  };
}
