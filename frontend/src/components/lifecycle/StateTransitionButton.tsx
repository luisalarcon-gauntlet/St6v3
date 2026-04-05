import type { CycleState } from '@/types/domain';
import { getCycleStateStyle } from '@/constants/styles';

interface StateTransitionButtonProps {
  cycleState: CycleState;
  onLock: () => void;
  onStartReconciliation: () => void;
  onReconcile: () => void;
  disabled?: boolean;
}

export function StateTransitionButton({
  cycleState,
  onLock,
  onStartReconciliation,
  onReconcile,
  disabled = false,
}: StateTransitionButtonProps) {
  if (cycleState === 'RECONCILED') return null;

  const config = {
    DRAFT: { label: 'Lock Plan', onClick: onLock },
    LOCKED: { label: 'Start Reconciliation', onClick: onStartReconciliation },
    RECONCILING: { label: 'Complete Reconciliation', onClick: onReconcile },
  } as const;

  const { label, onClick } = config[cycleState];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${getCycleStateStyle(cycleState).button} text-primary text-sm px-4 py-2 rounded font-medium transition-colors disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
