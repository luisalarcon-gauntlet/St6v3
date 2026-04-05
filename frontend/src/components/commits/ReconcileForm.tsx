import { useState, type FormEvent } from 'react';
import type { WeeklyCommit, CompletionStatus } from '@/types/domain';
import type { ReconcileCommitRequest } from '@/types/api';
import { ChessPieceIcon } from '@/components/chess/ChessPieceIcon';

interface ReconcileFormProps {
  commit: WeeklyCommit;
  onReconcile: (id: string, data: ReconcileCommitRequest) => Promise<void>;
}

const STATUSES: { value: CompletionStatus; label: string }[] = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'DROPPED', label: 'Dropped' },
];

export function ReconcileForm({ commit, onReconcile }: ReconcileFormProps) {
  const [actualHours, setActualHours] = useState(String(commit.actualHours ?? ''));
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>(
    commit.completionStatus,
  );
  const [notes, setNotes] = useState(commit.reconciliationNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onReconcile(commit.id, {
        actualHours: Number(actualHours) || 0,
        completionStatus,
        reconciliationNotes: notes,
        version: commit.version,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface border border-border rounded-lg p-4 transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <ChessPieceIcon category={commit.chessCategory} />
        <h2 className="text-white text-sm font-medium flex-1 truncate">{commit.title}</h2>
        <span className="text-xs text-gray-400 font-mono">{commit.plannedHours}h planned</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`hours-${commit.id}`} className="block text-xs text-gray-400 mb-1">
            Actual Hours
          </label>
          <input
            id={`hours-${commit.id}`}
            type="number"
            min={0}
            max={80}
            step="0.5"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor={`status-${commit.id}`} className="block text-xs text-gray-400 mb-1">
            Status
          </label>
          <select
            id={`status-${commit.id}`}
            value={completionStatus}
            onChange={(e) => setCompletionStatus(e.target.value as CompletionStatus)}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={`notes-${commit.id}`} className="block text-xs text-gray-400 mb-1">
          Notes
        </label>
        <textarea
          id={`notes-${commit.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-background border border-border rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="What happened this week?"
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && (
          <span className="text-success text-xs transition-opacity duration-300">Saved</span>
        )}
      </div>
    </form>
  );
}
