import type { ChessCategory } from '@/types/domain';
import { getChessStyle } from '@/constants/styles';

const PIECE_MAP: Record<ChessCategory, { icon: string; label: string }> = {
  KING: { icon: '\u265A', label: 'King' },
  QUEEN: { icon: '\u265B', label: 'Queen' },
  ROOK: { icon: '\u265C', label: 'Rook' },
  BISHOP: { icon: '\u265D', label: 'Bishop' },
  KNIGHT: { icon: '\u265E', label: 'Knight' },
  PAWN: { icon: '\u265F', label: 'Pawn' },
};

interface ChessPieceIconProps {
  category: ChessCategory;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ChessPieceIcon({ category, size = 'sm', showLabel = true }: ChessPieceIconProps) {
  const piece = PIECE_MAP[category] ?? { icon: '?', label: 'Unknown' };
  const style = getChessStyle(category);
  const sizeClasses = size === 'md' ? 'w-7 h-7 text-base' : 'w-5 h-5 text-xs';

  return (
    <span className="inline-flex items-center gap-1.5" title={piece.label}>
      <span
        className={`inline-flex items-center justify-center rounded ${sizeClasses} ${style.pill}`}
        aria-hidden="true"
      >
        {piece.icon}
      </span>
      {showLabel && <span className="text-xs text-muted">{piece.label}</span>}
    </span>
  );
}
