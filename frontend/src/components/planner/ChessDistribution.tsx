import type { ChessCategory, WeeklyCommit } from '@/types/domain';
import { ChessPieceIcon } from '@/components/chess/ChessPieceIcon';
import { CHESS_STYLES } from '@/constants/styles';

const ALL_PIECES: ChessCategory[] = ['KING', 'QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'PAWN'];

interface ChessDistributionProps {
  commits: WeeklyCommit[];
}

export function ChessDistribution({ commits }: ChessDistributionProps) {
  const counts = ALL_PIECES.reduce(
    (acc, cat) => {
      acc[cat] = commits.filter((c) => c.chessCategory === cat).length;
      return acc;
    },
    {} as Record<ChessCategory, number>,
  );

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
        Chess Distribution
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {ALL_PIECES.map((cat) => {
          const count = counts[cat];
          const style = CHESS_STYLES[cat];
          return (
            <div
              key={cat}
              className={`flex items-center gap-1.5 p-2 rounded transition-opacity duration-200 ${
                count > 0 ? '' : 'opacity-35'
              }`}
              style={{
                backgroundColor: count > 0 ? `${style.color}12` : 'transparent',
              }}
            >
              <ChessPieceIcon category={cat} showLabel={false} size="sm" />
              <span className="font-mono text-sm text-primary">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
