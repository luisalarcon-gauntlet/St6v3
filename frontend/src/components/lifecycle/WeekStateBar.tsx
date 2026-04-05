import type { CycleState } from '@/types/domain';
import { CYCLE_STATE_STYLES } from '@/constants/styles';

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
      <span className="text-sm text-muted font-mono">
        Week of {formatWeekDate(weekStartDate)}
      </span>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CYCLE_STATE_STYLES[state].badge}`}
      >
        {state}
      </span>
    </div>
  );
}
