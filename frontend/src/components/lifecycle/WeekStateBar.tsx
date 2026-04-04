import type { CycleState } from '@/types/domain';

interface WeekStateBarProps {
  state: CycleState;
  weekStartDate: string;
}

const STATE_COLORS: Record<CycleState, string> = {
  DRAFT: 'bg-primary/20 text-primary border-primary/30',
  LOCKED: 'bg-warning/20 text-warning border-warning/30',
  RECONCILING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  RECONCILED: 'bg-success/20 text-success border-success/30',
};

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function WeekStateBar({ state, weekStartDate }: WeekStateBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 font-mono">
        Week of {formatWeekDate(weekStartDate)}
      </span>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATE_COLORS[state]}`}
      >
        {state}
      </span>
    </div>
  );
}
