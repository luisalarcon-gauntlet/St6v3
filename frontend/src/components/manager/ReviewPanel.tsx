import { useState } from 'react';
import type { WeeklyCycle, CompletionStatus } from '@/types/domain';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface ReviewPanelProps {
  cycle: WeeklyCycle;
  onSubmitReview: (cycleId: string, notes: string) => Promise<void>;
  submitting: boolean;
}

const REVIEWABLE_STATES = ['LOCKED', 'RECONCILING', 'RECONCILED'];

export function ReviewPanel({ cycle, onSubmitReview, submitting }: ReviewPanelProps) {
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const isReviewable = REVIEWABLE_STATES.includes(cycle.state);
  const alreadyReviewed = cycle.reviewedAt != null;
  const activeCommits = cycle.commits.filter((c) => c.completionStatus !== undefined);

  if (!isReviewable || cycle.state === 'DRAFT') {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <p className="text-muted text-sm">Cannot review this cycle — it must be locked, reconciling, or reconciled.</p>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        <div>
          <p className="text-xs text-success font-medium uppercase tracking-wide">Already reviewed</p>
          <p className="text-primary text-sm mt-2">{cycle.reviewerNotes}</p>
        </div>
        <CommitSummary commits={activeCommits} />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      <CommitSummary commits={activeCommits} />

      <div>
        <label htmlFor="review-notes" className="block text-sm text-muted mb-1">
          Review Notes
        </label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors"
          placeholder="Share feedback on this week's commitments..."
        />
      </div>

      <button
        type="button"
        disabled={notes.trim() === '' || submitting}
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 min-h-[44px] text-sm text-primary bg-accent hover:bg-accent/80 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Review"
        message="Are you sure you want to submit this review? This action cannot be undone."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowConfirm(false);
          onSubmitReview(cycle.id, notes);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

function CommitSummary({ commits }: { commits: WeeklyCycle['commits'] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted uppercase tracking-wide font-medium">Commits</p>
      <ul className="space-y-1">
        {commits.map((commit) => (
          <li key={commit.id} className="flex items-center justify-between text-sm">
            <span className="text-primary truncate mr-3">{commit.title}</span>
            <StatusBadge status={commit.completionStatus} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: CompletionStatus }) {
  const styles: Record<CompletionStatus, string> = {
    NOT_STARTED: 'text-muted',
    IN_PROGRESS: 'text-warning',
    COMPLETED: 'text-success',
    CARRIED_FORWARD: 'text-primary',
    DROPPED: 'text-danger',
  };

  const labels: Record<CompletionStatus, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CARRIED_FORWARD: 'Carried Forward',
    DROPPED: 'Dropped',
  };

  return <span className={`text-xs shrink-0 ${styles[status]}`}>{labels[status]}</span>;
}
