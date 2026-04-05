import type { WeeklyCommit } from '@/types/domain';

interface WeekSummaryProps {
  commits: WeeklyCommit[];
}

export function WeekSummary({ commits }: WeekSummaryProps) {
  const totalCommits = commits.length;
  const totalPlanned = commits.reduce((sum, c) => sum + c.plannedHours, 0);
  const totalActual = commits.reduce((sum, c) => sum + (c.actualHours ?? 0), 0);
  const hasActuals = commits.some((c) => c.actualHours !== null);

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
        Week Summary
      </h3>
      <dl className="space-y-3">
        <div className="flex justify-between items-baseline">
          <dt className="text-sm text-muted">Commitments</dt>
          <dd className="text-lg font-mono font-bold text-primary">{totalCommits}</dd>
        </div>
        <div className="flex justify-between items-baseline">
          <dt className="text-sm text-muted">Planned Hours</dt>
          <dd className="text-lg font-mono font-bold text-primary">{totalPlanned}h</dd>
        </div>
        <div className="flex justify-between items-baseline">
          <dt className="text-sm text-muted">Actual Hours</dt>
          <dd
            className={`text-lg font-mono font-bold ${hasActuals ? 'text-accent' : 'text-muted/40'}`}
          >
            {hasActuals ? `${totalActual}h` : '\u2014'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
