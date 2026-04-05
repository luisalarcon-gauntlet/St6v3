import type { ChessCategory } from '@/types/domain';

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
}

export function ChessPieceIcon({ category }: ChessPieceIconProps) {
  const piece = PIECE_MAP[category];
  return (
    <span className="inline-flex items-center gap-1 text-sm" title={piece.label}>
      <span aria-hidden="true">{piece.icon}</span>
      <span className="text-xs text-muted">{piece.label}</span>
    </span>
  );
}
