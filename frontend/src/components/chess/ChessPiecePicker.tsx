import type { ChessCategory } from '@/types/domain';

const PIECES: { value: ChessCategory; label: string; icon: string }[] = [
  { value: 'KING', label: 'King', icon: '\u265A' },
  { value: 'QUEEN', label: 'Queen', icon: '\u265B' },
  { value: 'ROOK', label: 'Rook', icon: '\u265C' },
  { value: 'BISHOP', label: 'Bishop', icon: '\u265D' },
  { value: 'KNIGHT', label: 'Knight', icon: '\u265E' },
  { value: 'PAWN', label: 'Pawn', icon: '\u265F' },
];

interface ChessPiecePickerProps {
  value: ChessCategory | '';
  onChange: (value: ChessCategory) => void;
  disabledPieces?: string[];
}

export function ChessPiecePicker({ value, onChange, disabledPieces = [] }: ChessPiecePickerProps) {
  return (
    <div role="radiogroup" aria-label="Chess category" className="flex gap-2 flex-wrap">
      {PIECES.map((piece) => {
        const isDisabled = disabledPieces.includes(piece.value);
        const isSelected = value === piece.value;
        return (
          <label
            key={piece.value}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded border text-sm cursor-pointer
              transition-colors select-none
              ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-muted'}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="chessCategory"
              value={piece.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => onChange(piece.value)}
              className="sr-only"
              aria-label={piece.label}
            />
            <span className="text-lg" aria-hidden="true">{piece.icon}</span>
            <span>{piece.label}</span>
          </label>
        );
      })}
    </div>
  );
}
