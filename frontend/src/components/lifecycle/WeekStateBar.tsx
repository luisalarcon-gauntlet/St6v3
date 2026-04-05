import type { CycleState } from '@/types/domain';
import { getCycleStateStyle } from '@/constants/styles';

interface WeekStateBarProps {
  state: CycleState;
  weekStartDate: string;
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function WeekStateBar({ state, weekStartDate }: WeekStateBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted font-mono tracking-tight">
        Week of {formatWeekDate(weekStartDate)}
      </span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wide border ${getCycleStateStyle(state).badge}`}
      >
        {state}
      </span>
    </div>
  );
}
