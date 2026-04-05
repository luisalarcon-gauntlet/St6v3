import { useState, type FormEvent } from 'react';
import type { ChessCategory, RallyCry } from '@/types/domain';
import type { CreateCommitRequest } from '@/types/api';
import { ChessPiecePicker } from '@/components/chess/ChessPiecePicker';
import { RCDOTreePicker } from '@/components/rcdo/RCDOTreePicker';

interface CommitFormProps {
  cycleId: string;
  rcdoTree: RallyCry[];
  onSubmit: (data: CreateCommitRequest) => Promise<void>;
  existingChessCategories: string[];
}

interface FormErrors {
  title?: string;
  plannedHours?: string;
  outcomeId?: string;
  chessCategory?: string;
}

export function CommitForm({ rcdoTree, onSubmit, existingChessCategories }: CommitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedHours, setPlannedHours] = useState('');
  const [chessCategory, setChessCategory] = useState<ChessCategory | ''>('');
  const [outcomeId, setOutcomeId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    } else if (title.length > 200) {
      errs.title = 'Title must be 200 characters or fewer';
    }
    const hours = Number(plannedHours);
    if (plannedHours !== '' && (isNaN(hours) || hours < 0 || hours > 80)) {
      errs.plannedHours = 'Hours must be between 0 and 80';
    }
    if (!outcomeId) {
      errs.outcomeId = 'Outcome is required';
    }
    if (!chessCategory) {
      errs.chessCategory = 'Chess category is required';
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        plannedHours: Number(plannedHours) || 0,
        chessCategory: chessCategory as ChessCategory,
        outcomeId,
      });
      setTitle('');
      setDescription('');
      setPlannedHours('');
      setChessCategory('');
      setOutcomeId('');
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  const disabledPieces = existingChessCategories.includes('KING') ? ['KING'] : [];

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div>
        <label htmlFor="commit-title" className="block text-sm text-muted mb-1">
          Title
        </label>
        <input
          id="commit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border border-border rounded px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="What will you accomplish?"
        />
        {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="commit-description" className="block text-sm text-muted mb-1">
          Description
        </label>
        <textarea
          id="commit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-background border border-border rounded px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent transition-colors resize-none"
          placeholder="Optional details..."
        />
      </div>

      <div>
        <label htmlFor="commit-hours" className="block text-sm text-muted mb-1">
          Planned Hours
        </label>
        <input
          id="commit-hours"
          type="number"
          min={0}
          max={80}
          step="0.5"
          value={plannedHours}
          onChange={(e) => setPlannedHours(e.target.value)}
          className="w-32 bg-background border border-border rounded px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="0"
        />
        {errors.plannedHours && <p className="text-danger text-xs mt-1">{errors.plannedHours}</p>}
      </div>

      <div>
        <span className="block text-sm text-muted mb-1">Chess Category</span>
        <ChessPiecePicker
          value={chessCategory}
          onChange={setChessCategory}
          disabledPieces={disabledPieces}
        />
        {errors.chessCategory && <p className="text-danger text-xs mt-1">{errors.chessCategory}</p>}
      </div>

      <div>
        <span className="block text-sm text-muted mb-1">Outcome</span>
        <RCDOTreePicker tree={rcdoTree} value={outcomeId} onChange={setOutcomeId} />
        {errors.outcomeId && <p className="text-danger text-xs mt-1">{errors.outcomeId}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-accent text-primary text-sm px-4 py-2 rounded font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add Commit'}
      </button>
    </form>
  );
}
