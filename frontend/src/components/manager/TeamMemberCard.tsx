import type { TeamMemberOverview } from '@/types/domain';

interface TeamMemberCardProps {
  member: TeamMemberOverview;
  onSelect: (memberId: string) => void;
}

export function TeamMemberCard({ member, onSelect }: TeamMemberCardProps) {
  const cycle = member.currentCycle;
  const commitCount = cycle?.commits.length ?? 0;
  const totalPlannedHours = cycle?.commits.reduce((sum, c) => sum + c.plannedHours, 0) ?? 0;
  const isReviewed = cycle?.reviewedAt != null;

  return (
    <article
      className="bg-surface border border-border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-gray-500"
      onClick={() => onSelect(member.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-medium truncate">{member.displayName}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{member.email}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isReviewed && (
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">
              Reviewed
            </span>
          )}
          {cycle ? (
            <CycleStateBadge state={cycle.state} />
          ) : (
            <span className="text-xs text-gray-500">No cycle</span>
          )}
        </div>
      </div>

      {cycle && (
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span>{commitCount} commits</span>
          <span>{totalPlannedHours}h planned</span>
        </div>
      )}
    </article>
  );
}

function CycleStateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-500/10 text-gray-400',
    LOCKED: 'bg-primary/10 text-primary',
    RECONCILING: 'bg-warning/10 text-warning',
    RECONCILED: 'bg-success/10 text-success',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[state] ?? ''}`}>
      {state.charAt(0) + state.slice(1).toLowerCase()}
    </span>
  );
}
