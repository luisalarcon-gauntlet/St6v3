import type { WeeklyCommit, CycleState, RallyCry } from '@/types/domain';
import { ChessPieceIcon } from '@/components/chess/ChessPieceIcon';
import { CHESS_STYLES, COMPLETION_STATUS_STYLES } from '@/constants/styles';

interface CommitCardProps {
  commit: WeeklyCommit;
  rcdoTree: RallyCry[];
  cycleState: CycleState;
  onDelete: (id: string) => void;
}

export function CommitCard({ commit, rcdoTree, cycleState, onDelete }: CommitCardProps) {
  const outcomeName = findOutcomeName(rcdoTree, commit.outcomeId);
  const chess = CHESS_STYLES[commit.chessCategory];
  const status = COMPLETION_STATUS_STYLES[commit.completionStatus];

  return (
    <article
      className={`bg-surface border border-border rounded-lg p-4 transition-all duration-200 hover:border-muted ${chess.border} ${chess.card}`}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs text-muted shrink-0 mt-0.5">
          #{commit.priorityRank}
        </span>

        <ChessPieceIcon category={commit.chessCategory} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-primary text-sm font-semibold truncate">{commit.title}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-muted">{commit.plannedHours}h</span>
              {cycleState === 'DRAFT' && (
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => onDelete(commit.id)}
                  className="text-muted hover:text-danger text-sm transition-colors"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {outcomeName && (
              <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded truncate max-w-[200px]">
                {outcomeName}
              </span>
            )}
            <span
              className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border ${status.badge}`}
            >
              {status.label}
            </span>
          </div>
        </div>
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
