import type { WeeklyCommit, CycleState, RallyCry } from '@/types/domain';
import { ChessPieceIcon } from '@/components/chess/ChessPieceIcon';

interface CommitCardProps {
  commit: WeeklyCommit;
  rcdoTree: RallyCry[];
  cycleState: CycleState;
  onDelete: (id: string) => void;
}

export function CommitCard({ commit, rcdoTree, cycleState, onDelete }: CommitCardProps) {
  const outcomeName = findOutcomeName(rcdoTree, commit.outcomeId);

  return (
    <article className="bg-surface border border-border rounded-lg p-4 transition-all duration-200 hover:border-muted">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ChessPieceIcon category={commit.chessCategory} />
            <span className="text-sm font-mono text-muted">{commit.plannedHours}h</span>
          </div>
          <h2 className="text-primary text-sm font-medium truncate">{commit.title}</h2>
          {commit.description && (
            <p className="text-muted text-xs mt-1 line-clamp-2">{commit.description}</p>
          )}
          {outcomeName && (
            <p className="text-xs text-accent/70 mt-1 truncate">{outcomeName}</p>
          )}
        </div>

        {cycleState === 'DRAFT' && (
          <button
            type="button"
            aria-label="Delete"
            onClick={() => onDelete(commit.id)}
            className="text-muted hover:text-danger text-sm transition-colors shrink-0"
          >
            &times;
          </button>
        )}
      </div>
    </article>
  );
}

function findOutcomeName(tree: RallyCry[], outcomeId: string): string | null {
  for (const rc of tree) {
    for (const dObj of rc.definingObjectives) {
      for (const outcome of dObj.outcomes) {
        if (outcome.id === outcomeId) return outcome.title;
      }
    }
  }
  return null;
}
