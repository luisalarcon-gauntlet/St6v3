import type { CycleState } from '@/types/domain';

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
    DRAFT: { label: 'Lock Plan', onClick: onLock, className: 'bg-warning hover:bg-amber-600' },
    LOCKED: { label: 'Start Reconciliation', onClick: onStartReconciliation, className: 'bg-purple-500 hover:bg-purple-600' },
    RECONCILING: { label: 'Complete Reconciliation', onClick: onReconcile, className: 'bg-success hover:bg-emerald-600' },
  } as const;

  const { label, onClick, className } = config[cycleState];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${className} text-white text-sm px-4 py-2 rounded font-medium transition-colors disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
