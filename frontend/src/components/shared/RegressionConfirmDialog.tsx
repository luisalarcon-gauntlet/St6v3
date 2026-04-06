import { useState, useEffect, useCallback } from 'react';
import type { CycleState } from '@/types/domain';

interface RegressionConfirmDialogProps {
  open: boolean;
  memberName: string;
  currentState: CycleState;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  submitting?: boolean;
}

function formatState(state: CycleState): string {
  return state.charAt(0) + state.slice(1).toLowerCase();
}

export function RegressionConfirmDialog({
  open,
  memberName,
  currentState,
  onConfirm,
  onCancel,
  submitting = false,
}: RegressionConfirmDialogProps) {
  const [reason, setReason] = useState('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regression-dialog-title"
    >
      <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 max-w-md w-full mx-4 shadow-xl transition-transform duration-200">
        <h2 id="regression-dialog-title" className="text-primary font-medium text-lg">
          Regress Week
        </h2>
        <p className="text-muted text-sm mt-2">
          Send <span className="text-primary font-medium">{memberName}</span>&apos;s week back to
          Draft. Current state:{' '}
          <span className="text-accent font-medium">{formatState(currentState)}</span>
        </p>

        <label htmlFor="regression-reason" className="block text-sm text-muted mt-4 mb-1.5">
          Reason for regression
        </label>
        <textarea
          id="regression-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this week needs to be sent back..."
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent resize-none"
          rows={3}
          maxLength={2000}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 min-h-[44px] text-sm text-muted hover:text-primary border border-border rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={reason.trim() === '' || submitting}
            className="px-4 py-2 min-h-[44px] text-sm text-primary bg-danger hover:bg-danger/80 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Regressing\u2026' : 'Regress to Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
