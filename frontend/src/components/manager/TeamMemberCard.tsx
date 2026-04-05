import type { TeamMemberOverview, CycleState } from '@/types/domain';
import { getCycleStateStyle } from '@/constants/styles';

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
    <div
      className="bg-surface border border-border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-muted hover:shadow-lg hover:shadow-black/20 hover:-translate-y-px focus:outline-none focus:border-accent"
      role="button"
      tabIndex={0}
      aria-label={`View ${member.displayName}'s weekly commitments`}
      onClick={() => onSelect(member.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(member.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-primary text-sm font-medium truncate">{member.displayName}</h2>
          <p className="text-muted text-xs mt-0.5">{member.email}</p>
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
            <span className="text-xs text-muted">No cycle</span>
          )}
        </div>
      </div>

      {cycle && (
        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span>{commitCount} commits</span>
          <span>{totalPlannedHours}h planned</span>
        </div>
      )}
    </div>
  );
}

function CycleStateBadge({ state }: { state: CycleState }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${getCycleStateStyle(state).badge}`}>
      {state.charAt(0) + state.slice(1).toLowerCase()}
    </span>
  );
}
