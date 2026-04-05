import { useCallback, useEffect, useState } from 'react';
import type { TeamMemberOverview } from '@/types/domain';
import type { PageResponse } from '@/types/api';
import { getTeamOverview } from '@/api/manager';
import { normalizeError } from '@/api/client';
import type { AppError } from '@/types/errors';
import { TeamMemberCard } from './TeamMemberCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface TeamGridProps {
  onSelectMember: (memberId: string) => void;
}

export function TeamGrid({ onSelectMember }: TeamGridProps) {
  const [team, setTeam] = useState<PageResponse<TeamMemberOverview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [page, setPage] = useState(0);

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

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div role="alert" className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
        {error.detail}
      </div>
    );
  }

  if (!team || team.content.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No team members</p>
        <p className="text-sm mt-1">Your team will appear here once members are assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.content.map((member) => (
          <TeamMemberCard key={member.id} member={member} onSelect={onSelectMember} />
        ))}
      </div>

      {team.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            aria-label="Previous"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 text-sm text-muted hover:text-primary border border-border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {team.number + 1} of {team.totalPages}
          </span>

          <button
            type="button"
            aria-label="Next"
            disabled={team.number >= team.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm text-muted hover:text-primary border border-border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
